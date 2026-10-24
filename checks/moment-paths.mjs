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

const record=()=>ev(`(()=>{window.pairRecord={minGap:Infinity,minTurningGap:Infinity,minWalkingGap:Infinity,samples:0,lastAngle:null};window.recordPair=true;const sample=()=>{if(!recordPair)return;const dx=actors[1].position.x-actors[0].position.x,dz=actors[1].position.z-actors[0].position.z,gap=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),r=pairRecord;r.minGap=Math.min(r.minGap,gap);const inMoment=document.querySelector('button[aria-label="Share a kiss"]')?.disabled||document.querySelector('button[aria-label="Return to walking"]')||document.querySelector('.bouquet-caption');if(!inMoment)r.minWalkingGap=Math.min(r.minWalkingGap,gap);if(inMoment&&r.lastAngle!==null&&Math.abs(T.MathUtils.euclideanModulo(angle-r.lastAngle+Math.PI,Math.PI*2)-Math.PI)>.001)r.minTurningGap=Math.min(r.minTurningGap,gap);r.lastAngle=angle;r.samples++;requestAnimationFrame(sample);};requestAnimationFrame(sample);})()`);
const stop=()=>ev('recordPair=false;({...pairRecord})');
try {
await call('Runtime.enable');await boot(false);
const paths=await ev(`(async()=>{const m=await import('/src/lib/momentPath.ts');const a=new T.Vector3(),b=new T.Vector3(),center=new T.Vector3(),axis=new T.Vector3(),left=new T.Vector3(),right=new T.Vector3();let cases=0,minTurn=Infinity;for(const gap of [.73,.94,1])for(let from=0;from<24;from++)for(let to=0;to<8;to++){
 const start=from*Math.PI/12,end=to*Math.PI/4;a.set(-Math.sin(start)*.55,0,-Math.cos(start)*.55);b.copy(a).multiplyScalar(-1);center.set(.7,0,-.8);axis.set(Math.sin(end),0,Math.cos(end));const path=m.createMomentPath();m.planMomentPath(path,a,b,center,axis,gap);
 for(let j=0;j<=100;j++){const t=j/100;m.sampleMomentPosition(path,t,-1,left);m.sampleMomentPosition(path,t,1,right);const distance=left.distanceTo(right);if(distance<Math.min(gap,1.1)-1e-8)throw Error('pair overlaps');if(t>.18&&t<.70){minTurn=Math.min(minTurn,distance);if(distance<1.17999)throw Error('pair closes before turn completes');}}
 m.sampleMomentPosition(path,0,-1,left);m.sampleMomentPosition(path,0,1,right);if(left.distanceTo(a)>1e-8||right.distanceTo(b)>1e-8)throw Error('return endpoint changed');
 m.sampleMomentPosition(path,1,-1,left);m.sampleMomentPosition(path,1,1,right);if(left.distanceTo(center.clone().addScaledVector(axis,-gap/2))>1e-8||right.distanceTo(center.clone().addScaledVector(axis,gap/2))>1e-8)throw Error('interaction endpoint changed');cases++;
}return {cases,minTurn};})()`);assert.equal(paths.cases,576);console.log('PASS all-angle shared approach and reverse-path clearance',paths);
for(const mobile of [false,true]){
 if(mobile)await boot(true);
 for(const mode of ['kiss','photo']){
  await ev(`actors[0].position.set(.65,0,4);actors[1].position.set(-.65,0,4);actors[0].rotation.y=actors[1].rotation.y=0;document.querySelector('button[aria-label="${mode==='kiss'?'Share a kiss':'Pose together for a photo'}"]').click()`);
  await record();await wait(2700);
  if(mode==='kiss'){
   const grip=await ev(`(()=>{s.scene.updateMatrixWorld(true);const hand=(a,side)=>a.getObjectByName(side+'-arm').children.find(c=>Math.abs(c.position.y+.31)<.00001).getWorldPosition(new T.Vector3());return [hand(actors[0],'left').distanceTo(hand(actors[1],'right')),hand(actors[0],'right').distanceTo(hand(actors[1],'left'))]})()`);assert.ok(grip.every(d=>d<.065),'kiss hand grips preserved');
   await wait(6500);
  }else{await click('button[aria-label="Return to walking"]');await wait(4500);}
  const result=await stop();assert.ok(result.samples>30);assert.ok(result.minGap>(mode==='kiss'?.72:.99),'no interpenetration in approach/return '+JSON.stringify(result));assert.ok(result.minTurningGap>1.17,'clearance maintained while changing sides '+JSON.stringify(result));
  console.log('PASS '+(mobile?'mobile':'desktop')+' reversed starting sides, '+mode+' approach and return',result);
 }
 await ev('window.walkStart=actors[0].position.clone()');await key('w',true);await wait(400);await key('w',false);assert.ok(await ev('actors[0].position.distanceTo(walkStart)>.3'),'walking restored');
}
// A companion originally in front must arc around the player when rejoining.
await ev(`actors[0].position.set(0,0,0);actors[1].position.set(0,0,1.2);actors[0].rotation.y=actors[1].rotation.y=0;document.querySelector('button[aria-label="Pose together for a photo"]').click()`);
await record();await wait(2700);await click('button[aria-label="Return to walking"]');await wait(6000);const rejoin=await stop();assert.ok(rejoin.minWalkingGap>1.07,'safe rejoin from in front '+JSON.stringify(rejoin));console.log('PASS walking-formation rejoin curves around player',rejoin);
// The automatic gift uses the same route, then retains the frozen ending.
await boot(true);
for(const from of [0,1,2]){const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);}
await until('!!document.querySelector(".bouquet-caption")');await record();await wait(10600);const gift=await stop();assert.ok(gift.minGap>.93);assert.ok(gift.minTurningGap>1.17);console.log('PASS automatic bouquet approach and return',gift);
await resumeExistingEnding(ev);await until('!!document.querySelector(".ending-message")',10);const frozen=await snapshot();await wait(500);assert.deepEqual(await snapshot(),frozen);assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'));
assert.deepEqual(errors,[]);console.log('ALL MOMENT PATH CHECKS PASSED');
}finally{await ev('window.recordPair=false');await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
