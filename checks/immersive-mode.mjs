import assert from 'node:assert/strict';
const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ws = new WebSocket(tabs.find(p => p.url === 'http://127.0.0.1:5173/').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(), errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);} if(m.method === 'Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); });
const call = (method, params = {}) => new Promise(r => {const next = ++id;pending.set(next,r);ws.send(JSON.stringify({id:next,method,params}));});
const ev = async expression => {const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};
const wait = ms => new Promise(r => setTimeout(r,ms));
const click = async selector => {await ev(`document.querySelector(${JSON.stringify(selector)}).click()`);await wait(100);};
const exists = selector => ev(`!!document.querySelector(${JSON.stringify(selector)})`);
const message = () => ev(`document.querySelector('.immersive-message')?.innerText ?? ''`);
const reset = async () => {
  await ev('document.fullscreenElement ? document.exitFullscreen().catch(()=>{}) : null');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await call('Page.reload');await wait(700);
  for(let i=0;i<60&&!await exists('.intro-star');i++)await wait(200);
  // Isolate the manual retry tests from the separate automatic-entry check.
  await ev('document.querySelector(".museum-app").requestFullscreen=undefined');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);
  await click('.intro-star');await click('.intro-enter');await wait(1400);
  await ev('delete document.querySelector(".museum-app").requestFullscreen');
  await call('Emulation.setEmulatedMedia',{features:[]});
};
const mock = async code => ev(`(() => {
  window.activeFullscreen=null;window.lockCalls=0;window.unlockCalls=0;window.requestCalls=0;
  Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>activeFullscreen});
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});
  Object.defineProperty(document,'exitFullscreen',{configurable:true,writable:true,value:async()=>{activeFullscreen=null;document.dispatchEvent(new Event('fullscreenchange'));}});
  Object.defineProperty(screen.orientation,'unlock',{configurable:true,value:()=>{unlockCalls++;}});
  Object.defineProperty(screen.orientation,'lock',{configurable:true,value:async mode=>{lockCalls++;window.requestedOrientation=mode;}});
  document.querySelector('.museum-app').requestFullscreen=async options=>{requestCalls++;window.requestOptions=options;activeFullscreen=document.querySelector('.museum-app');document.dispatchEvent(new Event('fullscreenchange'));};
  ${code}
})()`);
try {
  await call('Runtime.enable'); errors.length=0;
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await reset();
  assert.ok(await exists('.immersive-entry'));
  await mock(`document.querySelector('.museum-app').requestFullscreen=undefined;`);
  await click('.immersive-entry');assert.match(await message(),/unavailable/);assert.equal(await exists('.immersive-exit'),false);assert.equal(await ev('lockCalls'),0);
  console.log('PASS unsupported fullscreen: honest fallback, no orientation attempt');
  await reset();await mock(`document.querySelector('.museum-app').requestFullscreen=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));`);
  await click('.immersive-entry');assert.match(await message(),/could not start/);assert.equal(await exists('.immersive-exit'),false);assert.equal(await ev('lockCalls'),0);assert.equal(await ev(`document.querySelector('.immersive-entry').disabled`),false);
  console.log('PASS denied fullscreen: no fake success and entry can retry');
  await mock(`document.querySelector('.museum-app').requestFullscreen=async()=>{};`);await click('.immersive-entry');assert.match(await message(),/did not start/);assert.equal(await exists('.immersive-exit'),false);
  console.log('PASS resolved promise without a fullscreen element is not accepted');
  await mock(`Object.defineProperty(screen.orientation,'lock',{configurable:true,value:async()=>{lockCalls++;throw new DOMException('Unsupported','NotSupportedError');}});`);
  await click('.immersive-entry');assert.ok(await exists('.immersive-exit'));assert.match(await message(),/landscape locking was not allowed/);assert.equal(await ev('requestOptions.navigationUI'),'hide');assert.equal(await ev('lockCalls'),1);
  await click('.immersive-exit');assert.equal(await exists('.immersive-exit'),false);
  console.log('PASS fullscreen with denied orientation lock, truthful portrait fallback and exit');
  await mock(`Object.defineProperty(screen.orientation,'lock',{configurable:true,value:undefined});`);await click('.immersive-entry');assert.match(await message(),/automatic rotation locking is unavailable/);await click('.immersive-exit');
  console.log('PASS unsupported orientation lock');
  await mock('');await click('.immersive-entry');assert.ok(await exists('.immersive-exit'));assert.equal(await ev('requestedOrientation'),'landscape');
  await call('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:true});await wait(700);assert.equal(await message(),'');
  const controls=JSON.parse(await ev(`JSON.stringify((()=>{const a=document.querySelector('.virtual-joystick').getBoundingClientRect(),b=document.querySelector('.museum-actions').getBoundingClientRect(),c=document.querySelector('.immersive-exit').getBoundingClientRect();return{separate:a.right<b.left,exit:[c.width,c.height],overflow:document.documentElement.scrollWidth>innerWidth};})())`));assert.ok(controls.separate);assert.ok(controls.exit.every(n=>n>=44));assert.equal(controls.overflow,false);
  await ev(`activeFullscreen=null;document.dispatchEvent(new Event('fullscreenchange'))`);await wait(150);assert.equal(await exists('.immersive-exit'),false);assert.equal(await ev('unlockCalls'),1);
  console.log('PASS landscape reflow, 44px exit target, system exit and orientation unlock');
  await reset();await mock(`document.exitFullscreen=()=>Promise.reject(new Error('Denied'));`);await click('.immersive-entry');await click('.immersive-exit');assert.ok(await exists('.immersive-exit'));assert.match(await message(),/Could not exit fullscreen/);
  console.log('PASS denied exit keeps real fullscreen state and explains browser exit');
  await reset();await mock(`Object.defineProperty(screen.orientation,'lock',{configurable:true,value:()=>new Promise(resolve=>{window.resolveLock=resolve;})});`);await click('.immersive-entry');await ev(`activeFullscreen=null;document.dispatchEvent(new Event('fullscreenchange'))`);await wait(100);assert.equal(await ev(`document.querySelector('.immersive-entry').disabled`),false);await ev('resolveLock()');await wait(100);assert.equal(await exists('.immersive-exit'),false);assert.equal(await ev('unlockCalls'),1);
  console.log('PASS exit during pending lock does not restore stale fullscreen state');
  // Real browser API path, without mocked document or orientation state.
  await reset();await click('.immersive-entry');await wait(500);
  const actual=await ev('document.fullscreenElement===document.querySelector(".museum-app")');
  assert.equal(await exists('.immersive-exit'),actual);
  if(actual){await click('.immersive-exit');assert.equal(await ev('document.fullscreenElement===null'),true);console.log('PASS native browser fullscreen entry and exit (orientation support is browser-dependent)');}
  else{assert.ok((await message()).length>0);console.log('PASS native browser rejection gracefully handled');}
  await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await wait(600);assert.equal(await exists('.immersive-ui'),false);
  console.log('PASS desktop immersive controls remain absent');assert.deepEqual(errors,[]);console.log('ALL IMMERSIVE MODE CHECKS PASSED');
} finally {await call('Page.reload');ws.close();}
