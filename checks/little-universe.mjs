import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { resumeExistingEnding } = await import(pathToFileURL(resolve('checks/legacy-ending.mjs')).href);
import assert from 'node:assert/strict';
import fs from 'node:fs';
let mobileControls = false;
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
const boot=async mobile=>{
mobileControls = mobile;
await ev('document.fullscreenElement?document.exitFullscreen():null');await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1100,height:mobile?844:850,deviceScaleFactor:1,mobile});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await call('Page.reload');await wait(700);for(let i=0;i<60&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');await wait(200);await click('.intro-enter');await wait(1700);await call('Emulation.setEmulatedMedia',{features:[]});await setup();await ev('window.originalCanvas=document.querySelector("canvas");window.visitMarker=12345');
};
const until=async(expression,seconds=10)=>{for(let i=0;i<seconds*10;i++){if(await ev(expression))return;await wait(100);}throw Error('Timeout: '+expression);};
const snapshot=()=>ev(`(()=>{s.scene.updateMatrixWorld(true);return {camera:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray(),fov:s.camera.fov,actors:actors.map(a=>{const all=[];a.traverse(o=>all.push([...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()]));return all;})}})()`);
try {
await call('Runtime.enable');await call('Log.enable');
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'){const text=m.params.args.map(a=>a.value||a.description||'').join(' ');if(/WebGLProgram|NaN|Infinity|GL_INVALID/.test(text))errors.push(text);}});
for(const mobile of [true,false]) {
await boot(mobile);
await click('button[aria-label="Play music"]');
const config=await ev(`(async()=>{window.config=await import('/src/config.ts');return config.PHOTOS;})()`);
for(const photo of config.filter(p=>!p.roomIndex)){
await ev(`(()=>{const p=${JSON.stringify(photo)};const normal=new T.Vector3(0,0,1).applyEuler(new T.Euler(...p.rotation));actors[0].position.fromArray(p.position).setY(0).addScaledVector(normal,1.5);actors[1].position.copy(actors[0].position).add(new T.Vector3(.4,0,.4));})()`);
await until(`document.querySelector('.photo-prompt')?.textContent.includes(${JSON.stringify(photo.title)})`);await click('.photo-prompt');await until('!!document.querySelector(".photo-modal")');assert.equal(await ev('document.querySelector("#photo-title").textContent'),photo.title);await click('button[aria-label="Close"]');await wait(100);
}
for(const from of [0,1,2]) {
  const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);
  if(from===0){
    const p=config.find(p=>p.id==='college-0');await ev(`actors[0].position.set(${p.position[0]},0,${p.position[2]+1.5});actors[1].position.copy(actors[0].position).add(new T.Vector3(.5,0,.2))`);await wait(250);await until('!!document.querySelector(".photo-prompt")');await click('.photo-prompt');await click('button[aria-label="Close"]');
  }
}
await until('!!document.querySelector(".bouquet-caption")');
assert.ok(await ev('!!s.scene.getObjectByName("our-little-universe")'));
assert.equal(await ev('!!s.scene.getObjectByName("room-outro")'),false,'no enclosed fourth room');
assert.equal(await ev('s.scene.getObjectsByProperty("name","outro-end-1").length'),0);
await until('!document.querySelector(".bouquet-caption")',20);
await resumeExistingEnding(ev);const frozenAtBouquet=await snapshot();
await until('!!document.querySelector(".ending-message")',10);await wait(1700);
const final=await snapshot();assert.deepEqual(final.actors,frozenAtBouquet.actors,'bodies completely frozen throughout pullback');
await key('w',true);await wait(250);await key('w',false);
await call('Input.dispatchMouseEvent',{type:'mousePressed',x:mobile?200:600,y:mobile?450:450,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:mobile?300:800,y:mobile?500:500,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:mobile?300:800,y:mobile?500:500,button:'left',clickCount:1});await wait(1200);
assert.deepEqual(await snapshot(),final,'no camera drift, body idle, walking or drag after ending');
const cards=await ev('s.scene.getObjectByName("memory-constellation").children.map(o=>o.name)');assert.equal(cards.length,5,'every collected memory once; repeated sample deduplicated');
assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),'bouquet retained');assert.ok(await ev('!!document.querySelector(`button[aria-label="Pause music"]`)'));
// Actual scene ray hit opens a floating card, with the original caption.
const hit=await ev(`(()=>{const g=s.scene.getObjectByName('memory-dance');const v=g.getWorldPosition(new T.Vector3()).project(s.camera);const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}})()`);
if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,...hit}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await call('Input.dispatchMouseEvent',{type:'mousePressed',...hit,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...hit,button:'left',clickCount:1});}await until('!!document.querySelector(".photo-modal")');assert.ok(await ev(`document.querySelector('.photo-modal').textContent.includes(${JSON.stringify(config[0].caption)})`));await click('button[aria-label="Close"]');
const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../little-universe-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
if(mobile){
await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await wait(300);
assert.ok(await ev(`(()=>{const message=document.querySelector('.ending-message').getBoundingClientRect();const c=s.scene.getObjectByName('memory-dance').getWorldPosition(new T.Vector3()).project(s.camera);return message.bottom<(1-c.y)*innerHeight/2-25&&document.documentElement.scrollWidth<=innerWidth})()`),'narrow phone message leaves memories unobstructed');
await call('Emulation.setDeviceMetricsOverride' ,{width:844,height:390,deviceScaleFactor:1,mobile:true});await wait(300);const landscape=await snapshot();await wait(400);assert.deepEqual(await snapshot(),landscape,'camera refits once on orientation, then stops');const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../little-universe-landscape.png',Buffer.from(shot.result.data,'base64'));}
await click('.ending-message > button');await until('!!document.querySelector(".intro-star")');assert.equal(await ev('!!document.querySelector("canvas")'),false);assert.equal(await ev('visitMarker'),12345,'no page reload on replay');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('.intro-star');await wait(100);await click('.intro-enter');await wait(1200);await setup();assert.ok(await ev('actors[0].position.distanceTo(new T.Vector3(0,0,4))<.1'));assert.equal(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),false);assert.equal(await ev('document.querySelector(".museum-location").textContent.includes("School Days")'),true);assert.ok(await ev('!!document.querySelector(`button[aria-label="Play music"]`)'));
if(mobile){
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(250);await click('button[aria-label="Open museum menu"]');await ev('document.querySelector(".menu-setting input").click()');await click('button[aria-label="Close museum menu"]');
for(const from of [0,1,2]){const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);}
await resumeExistingEnding(ev);await until('!!document.querySelector(".ending-message")',20);
assert.equal(await ev('s.scene.getObjectByName("memory-constellation").children.length'),0,'replay clears actual collection');assert.equal(await ev('!!s.scene.getObjectByName("universe-fireflies")'),false,'battery saver omits animated fireflies');assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),'fresh bouquet scene replays');
console.log('PASS empty collection after replay, repeated bouquet, battery saver and reduced-motion finale');
}
console.log('PASS '+(mobile?'phone portrait and landscape':'desktop')+' collection, deduplication, arch arrival, bouquet, frozen bodies/camera, floating photo interaction and replay');
}
assert.deepEqual(errors,[]);console.log('ALL LITTLE UNIVERSE CHECKS PASSED');
}finally{await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
