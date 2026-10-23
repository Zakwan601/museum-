import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await call('Page.reload');await wait(700);
for(let i=0;i<60&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');await wait(200);await click('.intro-enter');await wait(2200);await call('Emulation.setEmulatedMedia',{features:[]});await setup();
await ev(`(async()=>{window.books=(await import('/src/lib/books.ts')).BOOKS})()`);
assert.equal(await ev('books.length'),6);assert.ok(await ev(`!!s.scene.getObjectByName('school-bookshelf').userData.cameraObstacle`));
await ev('actors[0].position.set(-3.2,0,4.7);actors[1].position.set(-2.15,0,4.4)');await wait(1200);assert.ok(await ev('document.querySelector(".photo-prompt").innerText.includes("Tap to view book")'));
assert.ok(await ev(`books.every(b=>s.scene.getObjectByName(b.id).children[0].children.some(c=>c.material?.map?.image?.naturalWidth>0))`));
assert.equal(await ev(`performance.getEntriesByType('resource').filter(r=>r.name.includes('/books/')&&(r.name.endsWith('.gif')||r.name.endsWith('.jpg'))).length`),0);
await click('.photo-prompt');await wait(300);assert.ok(await ev('!!document.querySelector(".book-modal")'));assert.equal(await ev('document.activeElement.getAttribute("aria-label")'),'Close');
const before=await ev('actors[0].position.z');await key('w',true);await wait(300);await key('w',false);assert.ok(Math.abs(await ev('actors[0].position.z')-before)<.01);
await click('.photo-modal button[aria-label="Close"]');
await ev('actors[0].position.set(-1,0,4.6);actors[1].position.set(.05,0,4.3)');await wait(300);await ev(`s.setFrameloop('never')`);await wait(200);
await ev(`s.camera.position.set(-2.9,2.4,2.1);s.camera.lookAt(-3.2,1.9,6.38);s.camera.fov=60;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera)`);
for(let i=0;i<6;i++){
await wait(180);await ev(`s.setFrameloop('never')`);await wait(180);
await ev(`s.camera.position.set(-2.9,2.4,2.1);s.camera.lookAt(-3.2,1.9,6.38);s.camera.fov=60;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera)`);
const point=await ev(`(()=>{const p=s.scene.getObjectByName(books[${i}].id).getWorldPosition(new T.Vector3()).project(s.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}})()`);
await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await wait(150);
assert.equal(await ev('document.querySelector("#photo-title").innerText'),await ev(`books[${i}].title`));
assert.equal(await ev('!!document.querySelector(".book-source, .book-collection, .book-selection")'),false);
for(let j=0;j<30&&!await ev('document.querySelector(".book-cover").naturalWidth>0');j++)await wait(100);
assert.ok(await ev('document.querySelector(".book-cover").naturalWidth>0'));
if(i<5)await click('.photo-modal button[aria-label="Close"]');
}
await ev(`s.setFrameloop('always')`);
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await wait(900);
assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);assert.ok(await ev('document.querySelector(".photo-modal").getBoundingClientRect().bottom<=innerHeight'));
let shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../book-viewer-mobile.png',Buffer.from(shot.result.data,'base64'));
await click('.photo-modal button[aria-label="Close"]');await wait(250);
await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await call('Emulation.setTouchEmulationEnabled',{enabled:false});await wait(600);
await ev('actors[0].position.set(-1,0,4.6);actors[1].position.set(.05,0,4.3)');await wait(500);await ev(`s.setFrameloop('never')`);await wait(200);
await ev(`s.camera.position.set(-2.9,2.4,2.1);s.camera.lookAt(-3.2,1.9,6.38);s.camera.fov=60;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera);window.bookScreen=()=>{const p=s.scene.getObjectByName(books[0].id).getWorldPosition(new T.Vector3()).project(s.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}`);
shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../school-bookshelf.png',Buffer.from(shot.result.data,'base64'));
const point=await ev('bookScreen()');await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await wait(300);assert.ok(await ev('!!document.querySelector(".book-modal")'),'real 3D cover click opens viewer');await click('.photo-modal button[aria-label="Close"]');
await ev(`s.setFrameloop('always');actors[0].position.set(-3.2,0,4.8);actors[1].position.set(-2.15,0,4.5)`);await wait(300);await key('s',true);await wait(750);await key('s',false);await wait(250);assert.ok(await ev('actors[0].position.z')<=5.261,'shelf collision');
await ev('actors[0].position.set(0,0,-5.1);actors[1].position.set(1.05,0,-4.8)');await wait(700);assert.ok(await ev('document.querySelector(".photo-prompt").innerText.includes("Tap to view photo")'));await click('.photo-prompt');assert.equal(await ev('!!document.querySelector(".book-modal")'),false);await click('.photo-modal button[aria-label="Close"]');
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await wait(600);
await ev('actors[0].position.set(-3.2,0,4.2);actors[1].position.set(-2.15,0,4)');await wait(700);
for(const distance of [150,150,150,73.599]){
await call('Input.dispatchMouseEvent',{type:'mousePressed',x:300,y:600,button:'left',buttons:1,clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:300-distance,y:600,button:'left',buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:300-distance,y:600,button:'left',buttons:0,clickCount:1});await wait(120);
}await wait(1100);
const bp=await ev('bookScreen()');assert.ok(bp.x>0&&bp.x<390&&bp.y>0&&bp.y<844,'cover visible on phone');
const heading=await ev('s.camera.getWorldDirection(new T.Vector3()).toArray()');
const touch=(type,points)=>call('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:4,radiusY:4}))});
await touch('touchStart',[[1,bp.x,bp.y]]);await touch('touchMove',[[1,bp.x+40,bp.y+15]]);await touch('touchEnd',[]);await wait(400);
assert.equal(await ev('!!document.querySelector(".book-modal")'),false,'book drag does not open');assert.ok(await ev(`s.camera.getWorldDirection(new T.Vector3()).distanceTo(new T.Vector3(...${JSON.stringify(heading)}))`)<.02,'book drag does not orbit');
await touch('touchStart',[[1,bp.x,bp.y]]);await touch('touchEnd',[]);await wait(300);assert.ok(await ev('!!document.querySelector(".book-modal")'),'touch cover opens book');
await call('Emulation.setDeviceMetricsOverride',{width:640,height:320,deviceScaleFactor:1,mobile:true});await wait(500);assert.ok(await ev('document.querySelector(".photo-modal").getBoundingClientRect().bottom<=innerHeight'));assert.ok(await ev('document.querySelector(".photo-modal-scroll").scrollHeight>document.querySelector(".photo-modal-scroll").clientHeight'));await click('.photo-modal button[aria-label="Close"]');
console.log('PASS phone cover tap versus drag, camera isolation and short landscape viewer scrolling');
assert.deepEqual(errors,[]);console.log('PASS six authentic local covers, proximity prompt, all individual cover clicks, minimal viewer, modal movement lock, mobile fit, 3D cover click, shelf collision and original photo interaction');
}finally{await ev(`if(window.s)s.setFrameloop('always')`);await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
