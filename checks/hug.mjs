import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await call('Page.reload');await wait(700);
for(let i=0;i<150&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');for(let i=0;i<80&&!await ev('!!document.querySelector(".intro-enter")');i++)await wait(100);await click('.intro-enter');await wait(2200);await call('Emulation.setEmulatedMedia',{features:[]});await setup();

await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.cake&&p?.onCakeChange)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(f._roots.get(document.querySelector('canvas')).fiber.current)})()`);
const until=async expression=>{for(let i=0;i<120;i++){if(await ev(expression))return;await wait(100)}throw Error('Timeout '+expression)};
for(const [width,height] of [[1200,850],[390,844],[844,390]]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await call('Emulation.setTouchEmulationEnabled',{enabled:width<1000,maxTouchPoints:5});await wait(700);
 await ev('actors[0].position.set(0,0,0);actors[1].position.set(.88,0,-.22)');await wait(900);
 const positions=await ev('actors.map(a=>a.position.toArray())'),sequence=await ev('sceneProps.kiss.sequence');
 await click('button[aria-label="Share a hug"]');await wait(100);
 assert.equal(await ev('sceneProps.kiss.mode'),'hug');assert.equal(await ev('sceneProps.controls.paused'),true);
 await click('button[aria-label="Share a hug"]');assert.equal(await ev('sceneProps.kiss.sequence'),sequence+1,'duplicate start blocked');
 await until('sceneProps.kiss.elapsed>2.9');
 assert.deepEqual(await ev('actors.map(a=>a.position.toArray())'),positions,'feet stay at starting positions');
 assert.ok(await ev('actors.every(a=>a.getObjectByName("hug-upper-body").rotation.x>.4)'),'both lean into embrace');
 const fit=await ev(`(()=>{s.scene.updateMatrixWorld(true);s.camera.updateMatrixWorld();return actors.every(a=>{const v=new T.Vector3();let ok=true;a.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry?.attributes.position){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(s.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1)ok=false;}}});return ok})})()`);assert.ok(fit,'both complete hugging characters fit');
 const contact=await ev(`(()=>{s.scene.updateMatrixWorld(true);const out=[];for(let i=0;i<2;i++){const other=actors[1-i],pose=actors[i].getObjectByName('hug-upper-body');for(const side of ['left-arm','right-arm']){const hand=actors[i].getObjectByName(side).getObjectByName('hand').getWorldPosition(new T.Vector3());out.push({gap:Math.hypot(hand.x-other.position.x,hand.z-other.position.z),height:hand.y})}}return out})()`);assert.ok(contact.every(h=>h.gap<.5&&h.height>.55&&h.height<1.1),'all four hands wrap around partner torso');
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../hug-'+width+'.png',Buffer.from(shot.result.data,'base64'));
 const az=await ev('sceneProps.cameraState.azimuth');await wait(600);assert.equal(await ev('sceneProps.cameraState.azimuth'),az,'steady hug camera');
 await until('!sceneProps.kiss.active');await wait(300);assert.equal(await ev('sceneProps.controls.paused||sceneProps.cameraState.inputLocked'),false);
 assert.ok(await ev('actors.every(a=>a.getObjectByName("hug-upper-body").rotation.x===0)'),'body lean resets');
 console.log('PASS hug '+width+'x'+height+' fixed feet, four arm contacts, framing, steady camera and release');
}
// Existing kiss still uses the original mouth solver after a hug.
await click('button[aria-label="Share a kiss"]');await until('sceneProps.kiss.elapsed>2.6');
assert.ok(await ev(`(()=>{s.scene.updateMatrixWorld(true);return actors[0].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()).distanceTo(actors[1].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()))<.006})()`),'kiss contact preserved');
await until('!sceneProps.kiss.active');await key('w',true);const before=await ev('actors[0].position.toArray()');await wait(350);await key('w',false);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(before)}))>.1`),'movement restored');
assert.deepEqual(errors,[]);console.log('PASS existing kiss contact and movement after hugs');
}finally{await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
