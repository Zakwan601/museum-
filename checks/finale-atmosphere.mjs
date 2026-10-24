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
await call('Runtime.enable');await boot(true);
for(const from of [0,1,2]) {
 const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);
 await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);
}
await until('!!document.querySelector(".ending-message")',22);
const particles=()=>ev(`(()=>{
 const f=s.scene.getObjectByName('universe-fireflies'),p=s.scene.getObjectByName('universe-drifting-petals');
 return {flies:f?Array.from(f.geometry.attributes.position.array):[],colors:f?Array.from(f.geometry.attributes.color.array):[],petals:p?Array.from(p.instanceMatrix.array):[],petalCount:p?.count||0,stars:s.scene.getObjectByName('universe-stars').children.map(o=>o.material.opacity)};
})()`);
for(const [width,height,mobile] of [[390,844,true],[844,390,true],[1100,850,false]]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height,mobile,deviceScaleFactor:mobile?2:1});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await wait(500);
 const before=await particles(),frozen=await snapshot();await wait(550);const after=await particles();
 assert.equal(after.flies.length,mobile?12:18);assert.equal(after.petalCount,mobile?3:4);
 assert.notDeepEqual(before.flies,after.flies);assert.notDeepEqual(before.colors,after.colors);assert.notDeepEqual(before.petals,after.petals);assert.notDeepEqual(before.stars,after.stars);
 assert.deepEqual(await snapshot(),frozen,'environment moves while every actor transform and the camera stay exactly still');
 const beds=await ev(`(async()=>{const {gardenFlowerBeds}=await import('/src/lib/gardenLayout.ts');return gardenFlowerBeds;})()`);
 for(let i=0;i<after.flies.length;i+=3){const [x,y,z]=after.flies.slice(i,i+3);assert.ok(y>.1&&y<1);assert.ok(Math.hypot(x,z)>1.4);assert.ok(beds.some(b=>Math.hypot(x-b.x,z-b.z)<.4));}
 for(let i=0;i<after.petalCount;i++){const x=after.petals[i*16+12],y=after.petals[i*16+13],z=after.petals[i*16+14];assert.ok(y>.3&&y<1);assert.ok(Math.hypot(x,z)>1.4);assert.ok(beds.some(b=>Math.hypot(x-b.x,z-b.z)<.5));}
 const render=()=>ev('({...s.gl.info.render})');const visible=await render();await ev('s.scene.getObjectByName("garden-atmosphere").visible=false');await wait(200);const hidden=await render();
 assert.equal(visible.calls-hidden.calls,2,'only two batched draw calls');assert.equal(visible.points-hidden.points,mobile?4:6);assert.ok(visible.triangles-hidden.triangles<=60,'tiny shared petal geometry');
 await ev('s.scene.getObjectByName("garden-atmosphere").visible=true');await wait(100);
 console.log('PASS '+width+'x'+height+' bounded flower-bed particles, tiny draw budget, gentle twinkles and exactly frozen couple/camera');
 if(width===390){
   // Device-metric changes alone do not remount R3F's original DPR selection.
   await ev('s.setDpr(1.25)');await wait(200);
   await call('Emulation.setCPUThrottlingRate',{rate:4});
   const frames=await ev(`new Promise(resolve=>{const times=[];let start,last;const tick=t=>{if(start===undefined){start=last=t;}else{times.push(t-last);last=t;}if(t-start<3000){requestAnimationFrame(tick);return;}times.sort((a,b)=>a-b);resolve({frames:times.length,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],drawCalls:s.gl.info.render.calls,triangles:s.gl.info.render.triangles,dpr:s.gl.getPixelRatio(),contextLost:s.gl.getContext().isContextLost()});};requestAnimationFrame(tick);})`);
   assert.equal(frames.contextLost,false);assert.ok(frames.frames>0);console.log('Phone emulation, 4x CPU throttle (not physical-device FPS):',JSON.stringify(frames));await call('Emulation.setCPUThrottlingRate',{rate:1});
   const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../garden-atmosphere-mobile.png',Buffer.from(shot.result.data,'base64'));
 }
}
const originalCanvas=await ev('document.querySelector("canvas")===originalCanvas');assert.ok(originalCanvas);
const memory=await ev('({...s.gl.info.memory})');
for(let i=0;i<3;i++){
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(250);
 assert.equal(await ev('!!s.scene.getObjectByName("garden-atmosphere")'),false,'reduced motion removes drifting particles');
 const a=await particles();await wait(180);assert.deepEqual(await particles(),a,'reduced-motion stars remain steady');
 await call('Emulation.setEmulatedMedia',{features:[]});await wait(250);
 assert.ok(await ev('!!s.scene.getObjectByName("garden-atmosphere")'));
}
const restored=await ev('({...s.gl.info.memory})');assert.ok(restored.geometries<=memory.geometries+1);assert.ok(restored.textures<=memory.textures+1,'effect textures and geometry disposed between preference changes');
assert.deepEqual(errors,[]);console.log('ALL FINALE ATMOSPHERE CHECKS PASSED');
}finally{await call('Emulation.setCPUThrottlingRate',{rate:1});await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
