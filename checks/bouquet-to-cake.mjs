import assert from 'node:assert/strict';
import fs from 'node:fs';
let mobileControls = false;
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
const boot=async mobile=>{
mobileControls = mobile;
await ev('document.fullscreenElement?document.exitFullscreen():null');await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1100,height:mobile?844:850,deviceScaleFactor:1,mobile});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await call('Page.reload');await wait(700);for(let i=0;i<150&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');await until('!!document.querySelector(".intro-enter")',10);await click('.intro-enter');await wait(1700);await call('Emulation.setEmulatedMedia',{features:[]});await setup();await ev('window.originalCanvas=document.querySelector("canvas");window.visitMarker=12345');
};
const until=async(expression,seconds=10)=>{for(let i=0;i<seconds*10;i++){if(await ev(expression))return;await wait(100);}throw Error('Timeout: '+expression);};
const snapshot=()=>ev(`(()=>{s.scene.updateMatrixWorld(true);return {camera:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray(),fov:s.camera.fov,actors:actors.map(a=>{const all=[];a.traverse(o=>all.push([...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()]));return all;})}})()`);

const pointerTap=async(selector,mobile)=>{const p=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});}};
const positions=()=>ev('actors.map(a=>a.position.toArray())');

const decorationCheck=async(label)=>{
 const result=await ev(`(()=>{s.scene.updateMatrixWorld(true);s.camera.updateMatrixWorld();const g=s.scene.getObjectByName('cake-edge-decorations'), targets=actors.flatMap(a=>[a.getObjectByName('nose').getWorldPosition(new T.Vector3()),a.position.clone().add(new T.Vector3(0,1.65,0)),a.getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()),a.position.clone().add(new T.Vector3(0,.65,0))]);targets.push(cakePosition.clone().add(new T.Vector3(0,1.08,0)));const meshes=[];g.traverse(o=>{if(o.isMesh){o.raycast=o.isInstancedMesh?T.InstancedMesh.prototype.raycast:T.Mesh.prototype.raycast;meshes.push(o)}});const blocked=targets.map((p,i)=>{const d=p.clone().sub(s.camera.position),r=new T.Raycaster(s.camera.position,d.clone().normalize(),0,d.length()-.05);return r.intersectObjects(meshes,false).map(h=>({target:i,name:h.object.name}));}).flat();meshes.forEach(o=>o.raycast=()=>{});return {blocked,visible:g.visible,balloons:g.getObjectByName('cake-outer-balloons').count,flowers:g.getObjectByName('cake-low-roses').count,calls:s.gl.info.render.calls,triangles:s.gl.info.render.triangles};})()`);
 assert.deepEqual(result.blocked,[],label+' decorations leave faces, bodies and cake visible');assert.equal(result.balloons,6);assert.equal(result.flowers,18);assert.equal(result.visible,true);console.log(label,result);
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../cake-decor-'+label+'-'+(mobileControls?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
};

try {
await call('Runtime.enable');
for (const mobile of [true,false]) {
 await boot(mobile);
 await click('button[aria-label="Play music"]');
 await ev('actors[0].position.set(0,0,-5);actors[1].position.set(1.05,0,-5.3)');await until('!!document.querySelector(".photo-prompt")');await click('.photo-prompt');await until('!!document.querySelector(".photo-modal")');const memoryTitle=await ev('document.querySelector("#photo-title").textContent');await click('button[aria-label="Close"]');
 for(const from of [0,1,2]){const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);}
 await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.cake&&p?.onCakeChange)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(f._roots.get(document.querySelector('canvas')).fiber.current)})()`);
 await until('sceneProps.kiss.mode==="bouquet"&&sceneProps.kiss.elapsed>3',15);

 await until('sceneProps.cake.phase==="walking"',15);
 assert.ok(await ev('sceneProps.cake.reveal<1'),'walking starts before lighting reveal finishes');
 const start=await ev('actors[1].position.toArray()');await wait(650);
 assert.ok(await ev(`actors[1].position.distanceTo(new T.Vector3(...${JSON.stringify(start)}))>.1`),'boy immediately walks toward cake');
 await until('!!document.querySelector(".cake-invitation")',25);
 assert.equal(await ev('sceneProps.cake.reveal'),1);assert.equal(await ev('sceneProps.cake.npcArrived'),true);
 assert.equal(await ev('sceneProps.controls.paused'),false);
 console.log('PASS '+(mobile?'mobile':'desktop')+' immediate post-bouquet walk, simultaneous reveal, invitation and restored girl controls');
}
assert.deepEqual(errors,[]);
}finally{await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
