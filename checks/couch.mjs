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

const pointerTap=async(selector,mobile)=>{const p=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});}};
const positions=()=>ev('actors.map(a=>a.position.toArray())');






try {
 await call('Runtime.enable');
 for(const mobile of [false,true]){
  await boot(mobile);
  await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name),stack=[f._roots.get(document.querySelector('canvas')).fiber.current];while(stack.length){const n=stack.pop();if(!n)continue;if(n.memoizedProps?.couch&&n.memoizedProps?.onCouchChange){window.p=n.memoizedProps;break;}stack.push(n.child,n.sibling);}})()`);
  assert.ok(await ev(`actors.every(a=>a.getObjectsByProperty('name','right-sleeve-house-patch').length===1&&a.getObjectByName('right-sleeve-house-patch').parent.name==='sleeve')`),'one house patch attached to each right sleeve');
  assert.deepEqual(await ev(`actors.map(a=>a.getObjectByName('right-sleeve-house-patch').material.color.getHexString())`),['bd304a','3c995b']);
  // Scarf is attached to the existing girl; preserve actual geometry during walking.
  assert.equal(await ev('actors[0].getObjectsByProperty("name","school-scarf-front").length'),2);
  const scarf=await ev(`actors[0].getObjectsByProperty('name','school-scarf-front').map(m=>({position:m.position.toArray(),color:m.material.color.getHexString(),vertices:m.geometry.attributes.position.count}))`);
  await key('w',true);await wait(350);await key('w',false);assert.deepEqual(await ev(`actors[0].getObjectsByProperty('name','school-scarf-front').map(m=>({position:m.position.toArray(),color:m.material.color.getHexString(),vertices:m.geometry.attributes.position.count}))`),scarf);
  if(!mobile){
   await ev(`s.setFrameloop('never');actors[0].position.set(0,0,0);actors[0].rotation.y=0;actors[1].visible=false;s.camera.fov=45;s.camera.updateProjectionMatrix()`);
   for(const angle of [0,.5]){await ev(`s.camera.position.set(${Math.sin(.5)}*${angle?2.5:0},1.05,${angle?2.2:2.5});s.camera.lookAt(0,.95,0);s.camera.updateMatrixWorld();s.gl.render(s.scene,s.camera)`);const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../scarf-'+(angle?'angle':'front')+'.png',Buffer.from(shot.result.data,'base64'));}
   await ev(`actors[1].visible=true;s.setFrameloop('always')`);
  }
  await ev('actors[0].position.set(22,0,1.2);actors[1].position.set(22.88,0,.98)');await wait(2600);await until('p.couch.nearby');
  const before=await positions();const yaw=await ev('actors.map(a=>a.rotation.y)');
  for(let repeat=0;repeat<2;repeat++){
   await pointerTap('.couch-interaction button',mobile);assert.equal(await ev('p.couch.phase'),'entering');
   assert.equal(await ev(`(async()=>{const c=await import('/src/lib/couch.ts');return c.startCouch(p.couch)})()`),false,'duplicate sit blocked');
   await until('p.couch.phase==="seated"');await wait(300);
   assert.equal(await ev('document.querySelector(".couch-interaction button").textContent'),'Get Up');
   assert.ok(await ev('p.controls.paused&&p.cameraState.inputLocked'));
   const pose=await snapshot();await key('w',true);await wait(350);await key('w',false);assert.deepEqual(await snapshot(),pose,'seated body/face/camera stay still');
   const hands=await ev(`(()=>{s.scene.updateMatrixWorld(true);const h=actors.map(a=>['left-arm','right-arm'].map(n=>a.getObjectByName(n).getObjectByName('hand').getWorldPosition(new T.Vector3())));return Math.min(...h[0].flatMap(a=>h[1].map(b=>a.distanceTo(b))));})()`);assert.ok(hands>.11&&hands<.15,'palms align in shared handhold');
   assert.ok(await ev('actors.every(a=>Math.abs(a.getWorldPosition(new T.Vector3()).y+(a===actors[0]?.502:.529)-.805)<.01)'),'hips match measured cushion');

   assert.ok(await ev(`(()=>{s.scene.updateMatrixWorld(true);let clear=true;actors.forEach(a=>a.traverse(m=>{if(m.isMesh&&m.visible&&['sock','shoe','sole','strap','seated-calf'].includes(m.name)){const b=new T.Box3().setFromObject(m);if(b.max.z>2.766)clear=false;}}));return clear;})()`),'lower legs and heels clear cushion front');
   if(!mobile&&repeat===0){
     await ev('s.setFrameloop("never")');
     for(const angle of [0,1]){await ev(`s.camera.position.set(${angle?23.5:22},2.1,-1.38);s.camera.lookAt(22,1.2,2.82);s.camera.updateMatrixWorld();s.gl.render(s.scene,s.camera)`);const view=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../couch-'+(angle?'angle':'front')+'.png',Buffer.from(view.result.data,'base64'));}
     await ev('s.setFrameloop("always")');await wait(150);
   }
   const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../couch-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
   await pointerTap('.couch-interaction button',mobile);await until('p.couch.phase==="idle"');
   assert.ok(await ev(`actors.every((a,i)=>a.position.distanceTo(new T.Vector3(...${JSON.stringify(before)}[i]))<.04)`),'standing positions restored');
   assert.ok(await ev(`actors.every((a,i)=>Math.abs(T.MathUtils.euclideanModulo(a.rotation.y-${JSON.stringify(yaw)}[i]+Math.PI,Math.PI*2)-Math.PI)<.15)`),'standing facing restored');
   assert.equal(await ev('p.controls.paused'),false);
   await wait(300);
  }
  const start=await ev('actors[0].position.clone().toArray()');await key('w',true);await wait(350);await key('w',false);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(start)}))>.2`),'normal movement resumes');

  await ev(`actors[0].position.copy(new T.Vector3(...${JSON.stringify(before[0])}));actors[1].position.copy(new T.Vector3(...${JSON.stringify(before[1])}));`);await wait(1500);await until('p.couch.nearby');await ev('p.cameraState.azimuth=Math.PI;p.cameraState.pitch=.2');await wait(1000);
  const screen=await ev(`(()=>{s.camera.updateMatrixWorld();const v=new T.Vector3(23.1,.60,3.1).project(s.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}})()`);
  if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,...screen}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await call('Input.dispatchMouseEvent',{type:'mousePressed',...screen,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...screen,button:'left',clickCount:1});}
  await until('p.couch.phase==="seated"',5);
  await ev(`(async()=>{const {ROOM_PORTALS}=await import('/src/lib/roomTransition.ts');p.onPortalEnter(ROOM_PORTALS.find(a=>a.from===1&&a.to===2));})()`);await until('p.couch.phase==="idle"');await until('!p.transition.active',8);await wait(300);
  assert.ok(await ev('document.querySelector(".museum-location").textContent.includes("University Life")'),'real room transition cancels pose');assert.equal(await ev('p.controls.paused'),false);assert.ok(await ev('actors.every(a=>Math.abs(a.position.y)<.001)'));
  console.log('PASS '+(mobile?'mobile touch':'desktop')+' scarf attachment, couch repeat, seated freeze, palm alignment, return and movement');
 }
 assert.deepEqual(errors,[]);
}finally{ws.close();}
