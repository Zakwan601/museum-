import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await call('Page.reload');await wait(700);
for(let i=0;i<150&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');for(let i=0;i<80&&!await ev('!!document.querySelector(".intro-enter")');i++)await wait(100);await click('.intro-enter');await wait(2200);await call('Emulation.setEmulatedMedia',{features:[]});await setup();

await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const root=f._roots.get(document.querySelector('canvas')).fiber.current;const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.onPhotoClick&&p?.cake)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(root);window.letterText=(await import('/src/lib/loveLetter.ts')).LOVE_LETTER_TEXT;})()`);
const until=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await wait(100)}throw Error('Timeout '+expression)};
const snapshot=()=>ev(`(()=>{s.scene.updateMatrixWorld(true);return {camera:[...s.camera.position.toArray(),...s.camera.quaternion.toArray()],actors:actors.map(a=>{const v=[];a.traverse(o=>v.push([...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()]));return v})}})()`);
assert.equal(await ev('!!document.querySelector(".secret-letter-prompt")'),false);
await ev('actors[0].position.set(45,0,1.6);actors[1].position.set(44.1,0,1.4)');await wait(1800);
await until('!!document.querySelector(".secret-letter-prompt")');assert.equal(await ev('!!document.querySelector(".love-letter")'),false,'approach never opens automatically');
const envelopeShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../secret-envelope-discovery.png',Buffer.from(envelopeShot.result.data,'base64'));
await click('.secret-letter-prompt');await wait(200);
assert.equal(await ev('sceneProps.controls.paused&&sceneProps.cameraState.inputLocked'),true);
const n=await ev('document.querySelector(".letter-ink").textContent.length');assert.ok(n>1&&n<await ev('letterText.length'),'typewriter reveals gradually');
const still=await snapshot();await key('w',true);await call('Input.dispatchMouseEvent',{type:'mousePressed',x:600,y:300,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:650,y:350,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:650,y:350,button:'left',clickCount:1});await wait(500);await key('w',false);
assert.deepEqual(await snapshot(),still,'camera and both complete character poses stay exactly frozen');

await click('.letter-writing');assert.equal(await ev('document.querySelector(".letter-ink").textContent'),await ev('letterText'));
for(const [width,height] of [[1200,850],[390,844],[640,320]]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await wait(450);
 assert.ok(await ev('(()=>{const r=document.querySelector(".love-letter").getBoundingClientRect();return r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth})()'));
 assert.ok(await ev('(()=>{const r=document.querySelector(".letter-keep").getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight})()'));
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../secret-letter-'+width+'.png',Buffer.from(shot.result.data,'base64'));
}
await click('.letter-keep');await wait(200);assert.equal(await ev('sceneProps.controls.paused||sceneProps.cameraState.inputLocked'),false);
assert.equal(await ev('!!document.querySelector(".love-letter")'),false);
await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await wait(800);
// Point the existing camera at the actual envelope to exercise mesh picking.
await ev(`s.setFrameloop('never');s.camera.position.set(45,1.6,.8);s.camera.lookAt(45,.925,3.15);s.camera.updateMatrixWorld();s.camera.updateProjectionMatrix();s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera);window.envelopeScreen=()=>{const p=s.scene.getObjectByName('secret-love-envelope').getWorldPosition(new T.Vector3()).project(s.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}`);
let p=await ev('envelopeScreen()');
await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+35,y:p.y+5,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+35,y:p.y+5,button:'left',clickCount:1});await wait(400);assert.equal(await ev('!!document.querySelector(".love-letter")'),false,'dragging envelope never opens');
await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await until('!!document.querySelector(".love-letter")');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await wait(150);assert.equal(await ev('!!document.querySelector(".love-letter")'),false);
await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
p=await ev('envelopeScreen()');await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until('!!document.querySelector(".love-letter")');await click('.letter-keep');
await ev(`s.setFrameloop('always')`);await key('w',true);await wait(400);await key('w',false);assert.ok(await ev('actors[0].position.distanceTo(new T.Vector3(45,0,1.6))>.1'),'movement restored');
await ev('actors[0].position.set(22,0,0);actors[1].position.set(21,0,0)');await wait(400);assert.equal(await ev('!!document.querySelector(".secret-letter-prompt")'),false,'no prompt in other rooms');
assert.deepEqual(errors,[]);console.log('PASS Room 3 proximity, no auto-open, progressive text/skip, full camera and actor freeze, portrait/landscape scrolling, mesh mouse/touch, drag guard, reopen, Escape and movement resume');
}finally{await ev('if(window.s)s.setFrameloop("always")');await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
