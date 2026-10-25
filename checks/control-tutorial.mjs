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
  await boot(mobile);await until('!!document.querySelector(".control-tutorial")');
  assert.equal(await ev('document.querySelector(".control-tutorial").dataset.touch'),String(mobile));
  assert.ok(await ev('document.querySelector(".control-tutorial").textContent.includes('+JSON.stringify(mobile?'joystick':'W A S D')+')'));
  assert.equal(await ev('document.querySelector(".control-tutorial").children.length'),0,'plain hint, no card buttons or diagrams');
  await wait(350);assert.equal(await ev('document.querySelector(".control-tutorial").dataset.step'),'move','idle does not advance');
  for(const [width,height] of (mobile?[[320,568],[844,390],[568,320],[390,844]]:[[1100,850]])){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await wait(250);
    const fit=await ev(`(()=>{const r=document.querySelector('.control-tutorial').getBoundingClientRect(),j=document.querySelector('.virtual-joystick').getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight,overlap:!(r.right<=j.left||r.left>=j.right||r.bottom<=j.top||r.top>=j.bottom),background:getComputedStyle(document.querySelector('.control-tutorial')).backgroundColor};})()`);
    assert.ok(fit.left>=0&&fit.right<=fit.w&&fit.top>=0&&fit.bottom<=fit.h&&!fit.overlap);assert.equal(fit.background,'rgba(0, 0, 0, 0)');
  }
  const initial=(await positions())[0];
  if(mobile){const j=await ev(`(()=>{const r=document.querySelector('.virtual-joystick').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,...j}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:3,x:j.x,y:j.y-30}]});await wait(350);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await key('w',true);await wait(350);await key('w',false);}
  await until('document.querySelector(".control-tutorial")?.dataset.step==="look"');assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(initial)}))>.2`));
  const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../controls-hint-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
  if(!mobile){await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:730,y:500,buttons:0});await wait(200);assert.equal(await ev('document.querySelector(".control-tutorial").dataset.step'),'look','hover does not complete drag instruction');}
  if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,x:180,y:460}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:2,x:240,y:460}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await call('Input.dispatchMouseEvent',{type:'mousePressed',x:700,y:500,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:770,y:500,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:770,y:500,button:'left',clickCount:1});}
  await until('!document.querySelector(".control-tutorial")');await wait(300);assert.equal(await ev('!!document.querySelector(".control-tutorial")'),false);
  await click('button[aria-label="Open museum menu"]');await ev(`Array.from(document.querySelectorAll('#museum-menu button')).find(b=>b.textContent.includes('How to explore')).click()`);await until('document.querySelector(".control-tutorial")?.dataset.step==="move"');
  console.log('PASS '+(mobile?'touch':'desktop')+' plain bottom hint, responsive fit, real movement advances, actual look gesture dismisses, hover/idle ignored, menu reopening');
 }
 assert.deepEqual(errors,[]);
}finally{ws.close();}
