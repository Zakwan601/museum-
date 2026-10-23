import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
const boot=async mobile=>{
await ev('document.fullscreenElement?document.exitFullscreen():null');await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1100,height:mobile?844:850,deviceScaleFactor:1,mobile});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await call('Page.reload');await wait(700);for(let i=0;i<60&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');await wait(200);await click('.intro-enter');await wait(1800);await call('Emulation.setEmulatedMedia',{features:[]});await setup();
await ev(`window.handDistance=(actor)=>{s.scene.updateMatrixWorld(true);const bouquet=s.scene.getObjectByName('anniversary-rose-bouquet').getWorldPosition(new T.Vector3());return ['left','right'].map(side=>actor.getObjectByName(side+'-arm').children.find(c=>Math.abs(c.position.y+.31)<.00001).getWorldPosition(new T.Vector3()).distanceTo(bouquet))}`);
};
try {
await call('Runtime.enable');
for(const mobile of [false,true]) {
await boot(mobile);
// Walk into each magical arch to enter Future automatically.
for(const from of [0,1,2]) {
  const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);
  await wait(250);await key('d',true);
  for(let i=0;i<60&&!await ev('!!document.querySelector(".room-transition-overlay.is-active")');i++)await wait(50);
  await key('d',false);assert.ok(await ev('!!document.querySelector(".room-transition-overlay.is-active")'));
  for(let i=0;i<40&&await ev('!!document.querySelector(".room-transition-overlay.is-active")');i++)await wait(100);
}
for(let i=0;i<20&&!await ev('!!document.querySelector(".bouquet-caption")');i++)await wait(100);
assert.ok(await ev('!!document.querySelector(".bouquet-caption")'),'automatic first-entry scene');assert.equal(await ev('!!document.querySelector(".museum-actions")'),false);assert.ok(await ev('document.querySelector(`button[aria-label="Open museum menu"]`).disabled'));
await wait(3100);assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'));assert.ok((await ev('handDistance(actors[1])')).every(d=>d<.065),'boy grips bouquet');
let shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../bouquet-offer-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
await wait(2900);assert.ok((await ev('handDistance(actors[0])')).every(d=>d<.065),'girl accepts at actual stem');
shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../bouquet-received-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
if(mobile){await call('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await wait(500);assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);}
for(let i=0;i<65&&await ev('!!document.querySelector(".bouquet-caption")');i++)await wait(100);
assert.equal(await ev('!!document.querySelector(".bouquet-caption")'),false,'cinematic completes');assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),'girl keeps bouquet');assert.ok(await ev('!document.querySelector(`button[aria-label="Open museum menu"]`).disabled'));
const before=await ev('actors[0].position.toArray()');await key('w',true);await wait(550);await key('w',false);await wait(200);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(before)}))`)>.5,'walking restored');assert.ok((await ev('handDistance(actors[0])')).every(d=>d<.065),'bouquet stays in moving hands');
await ev('actors[0].position.set(44,0,0);actors[1].position.set(45.05,0,-.3)');await wait(250);await ev('actors[0].position.set(66,0,0);actors[1].position.set(67.05,0,-.3)');await wait(700);assert.equal(await ev('!!document.querySelector(".bouquet-caption")'),false,'no repeat on reentry');
console.log('PASS '+(mobile?'mobile portrait/landscape':'desktop')+' auto entry, both grips, completion, keepsake, movement and once-only reentry');
}
await click('button[aria-label="Pose together for a photo"]');await wait(2600);assert.ok(await ev('!!document.querySelector(`button[aria-label="Return to walking"]`)'));await click('button[aria-label="Return to walking"]');await wait(4300);assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'));
await click('button[aria-label="Share a kiss"]');await wait(2600);assert.ok(await ev('document.querySelector(`button[aria-label="Share a kiss"]`).disabled'));await wait(6200);assert.ok(await ev('!document.querySelector(`button[aria-label="Share a kiss"]`).disabled'));assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'));
assert.deepEqual(errors,[]);console.log('PASS existing photo pose and kiss restore carrying, no runtime exceptions');
}finally{await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
