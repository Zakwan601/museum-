import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
try {
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1200,height:850,deviceScaleFactor:1,mobile:false});await call('Page.reload');await wait(700);
for(let i=0;i<150&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');for(let i=0;i<80&&!await ev('!!document.querySelector(".intro-enter")');i++)await wait(100);await click('.intro-enter');await wait(2200);await call('Emulation.setEmulatedMedia',{features:[]});await setup();
await ev(`(async()=>{window.books=(await import('/src/lib/books.ts')).BOOKS})()`);


await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const root=f._roots.get(document.querySelector('canvas')).fiber.current;const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.onPhotoClick&&p?.cake)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(root)})()`);
for(const [width,height] of [[1200,850],[390,844],[640,320]]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});
 for(let i=0;i<6;i++) {
  await ev(`sceneProps.onPhotoClick(books[${i}])`);await wait(200);
  assert.ok(await ev('document.querySelector(".book-modal").classList.contains("vintage-photo")'));
  assert.equal(await ev('!!document.querySelector(".book-modal .photo-modal-header, .book-modal .vintage-date")'),false);
  assert.equal(await ev('document.querySelector(".book-modal .photo-caption").textContent'),await ev(`books[${i}].caption`));
  assert.ok(await ev('document.querySelector("#photo-title").classList.contains("sr-only")'));
  assert.ok(await ev('document.querySelector(".book-cover").naturalWidth>0'));
  assert.ok(await ev('(()=>{const r=document.querySelector(".book-modal").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})()'));
  const close=await ev('(()=>{const r=document.querySelector(".photo-card-close").getBoundingClientRect();return r.width>=44&&r.height>=44&&r.bottom<=innerHeight})()');assert.ok(close);
  if(i===0){const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../book-card-'+width+'.png',Buffer.from(shot.result.data,'base64'));}
  await click('.photo-card-close');
 }
 console.log('PASS all six book cards at '+width+'x'+height);
}
assert.deepEqual(errors,[]);
} finally {await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
