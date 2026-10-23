import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();const ws=new WebSocket(tabs.find(p=>p.url==='http://127.0.0.1:5173/').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);const setup=()=>ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);let root;for(let i=0;i<100&&!(root=f._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));window.s=root.store.getState();window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));})()`);const key=(k,down)=>call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:'Key'+k.toUpperCase()});
const boot=async mobile=>{
await ev('document.fullscreenElement?document.exitFullscreen():null');await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1100,height:mobile?844:850,deviceScaleFactor:1,mobile});await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await call('Page.reload');await wait(700);for(let i=0;i<60&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);await click('.intro-star');await wait(200);await click('.intro-enter');await wait(1700);await call('Emulation.setEmulatedMedia',{features:[]});await setup();await ev('window.originalCanvas=document.querySelector("canvas");window.visitMarker=12345');
};
const stage=async(from,direction)=>{
const x=from*22+direction*7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-direction*.35},0,${-direction*1.05})`);await wait(400);
for(let i=0;i<30&&!await ev('!!document.querySelector(".portal-prompt")');i++)await wait(100);assert.ok(await ev('!!document.querySelector(".portal-prompt")'));
};
const travel=async(from,to,particles=true)=>{
await stage(from,Math.sign(to-from));
const old=await ev('actors[0].position.x');const started=Date.now();await click('.portal-prompt');assert.ok(await ev('!!document.querySelector(".room-transition-overlay.is-active")'));
assert.ok(await ev('document.querySelector(".museum-joystick").classList.contains("invisible")'));
let relocated=false,sparkles=false;
for(let i=0;i<45;i++){
await wait(80);const sample=await ev(`({x:actors[0].position.x,fade:Number(document.querySelector('.room-transition-overlay').style.opacity),active:!!document.querySelector('.room-transition-overlay.is-active'),particles:s.scene.getObjectsByProperty('type','Points').some(p=>p.visible&&p.parent.name.startsWith('magic-portal-')&&p.material.opacity>.05)})`);
if(sample.particles)sparkles=true;
if(!relocated&&Math.abs(sample.x-old)>3){assert.ok(sample.fade>.98,'relocation hidden by fully opaque fade');relocated=true;}
if(!sample.active)break;
}
const elapsed=Date.now()-started;assert.ok(elapsed>=2300&&elapsed<3400,`transition takes about 2.6 seconds (observed ${elapsed}ms)`);assert.ok(relocated);assert.equal(sparkles,particles);
assert.ok(await ev('document.querySelector("canvas")===originalCanvas&&visitMarker===12345'),'scene/page not reset');
assert.ok(await ev(`actors.every(a=>Math.abs(a.position.x-${to*22})<9)`),'both characters arrive in destination');
const label=await ev('document.querySelector(".museum-location").innerText');assert.ok(label.includes(['School Days','College Days','University Life','Future'][to]));
if(to===3){for(let i=0;i<135&&await ev('!!document.querySelector(".bouquet-caption")');i++)await wait(100);}
assert.ok(await ev('!document.querySelector(".museum-joystick").classList.contains("invisible")'),'controls restored');
console.log('PASS portal '+from+' -> '+to+': '+elapsed+'ms, together, opaque swap, particles='+particles);
};
try {
await call('Runtime.enable');
for(const mobile of [false,true]){
await boot(mobile);await click('button[aria-label="Play music"]');
await ev('actors[0].position.set(7.8,0,0);actors[1].position.set(1,0,0)');await wait(150);assert.equal(await ev('!!document.querySelector(".portal-prompt")'),false,'wait for both characters');
await stage(0,1);
if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:70,y:772}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:106,y:772}]});await wait(650);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
else{await key('d',true);await wait(650);await key('d',false);}
await wait(180);assert.ok(await ev('actors[0].position.x')<=8.801,'threshold waits for Continue');assert.ok(await ev('document.querySelector(".museum-location").innerText.includes("School Days")'));
for(const [from,to] of [[0,1],[1,2],[2,3],[3,2],[2,1],[1,0]])await travel(from,to);
assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),'collected bouquet survives return trips');
assert.ok(await ev('!!document.querySelector(`button[aria-label="Pause music"]`)'),'music state survives');
const before=await ev('actors[0].position.toArray()');await key('w',true);await wait(500);await key('w',false);await wait(150);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(before)}))`)>.5);
console.log('PASS '+(mobile?'mobile':'desktop')+' full route both ways, explicit choice, progress and controls');
}
await click('button[aria-label="Open museum menu"]');await ev('document.querySelector(".menu-setting input").click()');await click('button[aria-label="Close museum menu"]');await travel(0,1,false);
await click('button[aria-label="Open museum menu"]');await ev('document.querySelector(".menu-setting input").click()');await click('button[aria-label="Close museum menu"]');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(200);await travel(1,0,false);
assert.deepEqual(errors,[]);console.log('PASS battery saver / reduced-motion simple-fade fallbacks; no runtime exceptions');
}finally{await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
