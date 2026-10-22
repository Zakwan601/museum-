import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await call('Page.reload');await wait(1800);
assert.equal(await ev('!!document.querySelector("canvas")'),false);
await click('.intro-star');await wait(600);
assert.equal(await ev('!!document.querySelector(".intro-enter")'),false);
assert.equal(await ev('document.activeElement.id'),'intro-title');
await wait(5300);assert.ok(await ev('!!document.querySelector(".intro-enter")'));
for(const [width,height] of [[320,568],[844,390],[390,844]]) {
await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await wait(150);
assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
assert.ok(await ev('document.querySelector(".intro").scrollHeight>=innerHeight'));
}
let shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../intro-wish-preview.png',Buffer.from(shot.result.data,'base64'));
await click('.intro-enter');await wait(2200);assert.equal(await ev('!!document.querySelector(".intro")'),false);assert.ok(await ev('!!document.querySelector("canvas")'));await setup();
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await wait(500);
const before=await ev('actors[0].position.z');await key('w',true);await wait(500);await key('w',false);await wait(250);assert.ok(await ev('actors[0].position.z')<before-.5);
console.log('PASS star activation, gradual wish, mobile layouts, museum entry and movement');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await call('Page.reload');await wait(1500);await click('.intro-star');await wait(100);assert.ok(await ev('!!document.querySelector(".intro-enter")'));assert.equal(await ev('getComputedStyle(document.querySelector(".intro-star")||document.querySelector(".intro-line")).animationName'),'none');await click('.intro-enter');await wait(1200);assert.ok(await ev('!!document.querySelector("canvas")'));
assert.deepEqual(errors,[]);console.log('PASS reduced motion and no runtime errors');
} finally {await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
