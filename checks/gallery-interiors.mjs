import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1100,height:800,deviceScaleFactor:1,mobile:false});await call('Page.reload');await wait(700);
for(let i=0;i<150&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');for(let i=0;i<80&&!await ev('!!document.querySelector(".intro-enter")');i++)await wait(100);await click('.intro-enter');await wait(2000);await call('Emulation.setEmulatedMedia',{features:[]});await setup();
assert.equal(await ev(`s.scene.getObjectsByProperty('name','arched-door').length`),5);
for(const center of [22,44]) {
await ev(`actors[0].position.set(${center},0,0);actors[1].position.set(${center+1.05},0,-.35)`);await wait(1000);
await ev(`s.setFrameloop('never')`);await wait(200);
await ev(`s.camera.position.set(${center+1.6},2.7,5.9);s.camera.lookAt(${center},2.25,-4);s.camera.fov=76;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.gl.render(s.scene,s.camera)`);
const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../'+(center===22?'midnight-gallery':'golden-gallery')+'.png',Buffer.from(shot.result.data,'base64'));await ev(`s.setFrameloop('always')`);
}
await ev(`(async()=>{window.galleryPhotos=(await import('/src/config.ts')).PHOTOS.filter(p=>p.roomIndex)})()`);
for(const mobile of [false,true]) {
await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await wait(600);
for(const roomIndex of [1,2]) {
const p=await ev(`galleryPhotos.find(p=>p.roomIndex===${roomIndex}).position`);
await ev(`actors[0].position.set(${p[0]},0,-5.05);actors[1].position.set(${p[0]+1.05},0,-4.8)`);await wait(850);
assert.ok(await ev('!!document.querySelector(".photo-prompt")'));await click('.photo-prompt');await wait(150);assert.ok(await ev('!!document.querySelector(".photo-modal")'));await click('.photo-modal button[aria-label="Close"]');await wait(200);
await ev(`actors[0].position.set(${roomIndex*22},0,1.3);actors[1].position.set(${roomIndex*22+1.05},0,1)`);await wait(300);
await key('s',true);await wait(850);await key('s',false);await wait(250);assert.ok(await ev('actors[0].position.z')<1.93,'bench stops movement');
}
assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
console.log('PASS '+(mobile?'mobile':'desktop')+' photo prompts, viewers, furniture collision and no overflow');
}
assert.deepEqual(errors,[]);console.log('PASS all five interior archways and galleries, with no runtime exceptions; previews saved');
}finally{ws.close();}
