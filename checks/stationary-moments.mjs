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
for(const mobile of [true,false]) {
 await boot(mobile);
 await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name),stack=[f._roots.get(document.querySelector('canvas')).fiber.current];while(stack.length){const n=stack.pop();if(!n)continue;if(n.memoizedProps?.kiss&&n.memoizedProps?.onBouquetStart){window.p=n.memoizedProps;break;}stack.push(n.child,n.sibling);}})()`);
 await ev('actors[1].position.set(4,0,4)');await wait(50);await click('button[aria-label="Share a kiss"]');assert.equal(await ev('p.kiss.active'),false,'far kiss rejected');
 await ev('actors[0].position.set(0,0,4);actors[1].position.set(1.05,0,3.65)');await wait(800);
 for(const mode of ['kiss','bouquet']) {
 await ev(`window.before=actors.map(a=>a.position.clone());window.samples=[];window.contacts=[];window.watch=true;window.tick=()=>{if(!watch)return;if(p.kiss.active){if(!samples.length)before=actors.map(a=>a.position.clone());samples.push(actors.map((a,i)=>a.position.distanceTo(before[i])));if(p.kiss.mode==='kiss'&&p.kiss.elapsed>2.3&&p.kiss.elapsed<4.1){s.scene.updateMatrixWorld(true);contacts.push(actors[0].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()).distanceTo(actors[1].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3())));}}requestAnimationFrame(tick)};tick()`);
 if(mode==='kiss') await click('button[aria-label="Share a kiss"]');else await ev('p.onBouquetStart()');
 await until('p.kiss.active');await until('!p.kiss.active',20);await ev('watch=false');
 assert.ok(await ev('samples.length>30&&samples.every(s=>s.every(d=>d<.000001))'),'feet stay exactly in place throughout '+mode);
 if(mode==='kiss')assert.ok(await ev('contacts.length>5&&contacts.every(d=>d<.006)'), 'mouths meet during kiss hold');
 assert.ok(await ev('!document.querySelector(".cinema-bars")'));
 console.log('PASS '+(mobile?'mobile':'desktop')+' stationary '+mode+', no crossing or swapping');
 }
}
assert.deepEqual(errors,[]);console.log('ALL STATIONARY MOMENT CHECKS PASSED');
}finally{ws.close();}
