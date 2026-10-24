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
for (const mobile of [true,false]) {
 await boot(mobile);
 for(const from of [0,1,2]){const x=from*22+7.8;await ev(`actors[0].position.set(${x},0,0);actors[1].position.set(${x-.35},0,-1.05)`);await wait(250);await key('d',true);await until('!!document.querySelector(".room-transition-overlay.is-active")');await key('d',false);await until('!document.querySelector(".room-transition-overlay.is-active")',8);}
 await until('!!document.querySelector(".cake-invitation")',28);
 await ev(`(async()=>{const fiber=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const f=fiber._roots.get(document.querySelector('canvas')).fiber.current;const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.cake&&p?.onCakeChange)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(f);window.c=sceneProps.cake;})()`);
 assert.equal(await ev('c.phase'),'inviting');
 assert.equal(await ev('c.lit'),0);
 // Exercise a near approach, then use a real mouse/touch activation.
 await ev(`(async()=>{const {CAKE}=await import('/src/lib/cake.ts');actors[0].position.copy(CAKE.position).add(new T.Vector3(1.2,0,.1));window.cakePosition=CAKE.position;})()`);
 await until('!!document.querySelector(".cake-wish-button")');
 await pointerTap('.cake-wish-button',mobile);
 assert.equal(await ev('c.phase'),'positioning');assert.equal(await ev('!!document.querySelector(".cake-wish-button")'),false);
 assert.equal(await ev(`(async()=>{const m=await import('/src/lib/cake.ts');return m.startCakeCeremony(c)})()`),false,'duplicate start rejected');
 await ev(`window.samples=[];window.watch=true;window.monitor=()=>{if(!watch)return;const light=s.scene.getObjectByName('cake-candle-light');samples.push({phase:c.phase,lit:c.lit,flame:c.flame,eyes:c.eyesClosed,light:light.intensity,gap:actors[0].position.distanceTo(actors[1].position),cakeGap:actors[0].position.distanceTo(cakePosition),boyGap:actors[1].position.distanceTo(cakePosition),positions:actors.map(a=>a.position.toArray())});requestAnimationFrame(monitor)};monitor()`);
 await until('c.phase==="lighting"',20);
 assert.ok(await ev('samples.every(p=>p.gap>=1.025&&p.cakeGap>=.999&&p.boyGap>=.999)'),'characters never intersect each other or pedestal');
 await key('w',true);const stationary=await positions();await wait(300);await key('w',false);assert.deepEqual(await positions(),stationary,'normal controls locked during ceremony');
 await until('c.phase==="wish"',8);
 assert.equal(await ev('document.querySelector(".cake-wish-message").textContent'),'Close your eyes. If you could make one wish for us, what would it be?');
 assert.equal(await ev('!!document.querySelector(".cake-blow-button")'),false,'readable pause before continuation');
 assert.equal(await ev('c.lit'),3);assert.equal(await ev('s.scene.getObjectByName("cake-flames").children.filter(o=>o.visible).length'),3);
 assert.ok(await ev('[1,2,3].every(i=>samples.some(p=>p.lit===i))'),'candles light in sequence');
 await until('!!document.querySelector(".cake-blow-button")',6);
 const b=await ev(`(()=>{const r=document.querySelector('.cake-blow-button').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);assert.ok(b.w>=44&&b.h>=44&&b.y>=0&&b.y+b.h<=(mobile?844:850));
 await wait(650);
 const checkFraming=()=>ev(`(()=>{s.camera.updateMatrixWorld();return actors.every(a=>{const v=new T.Vector3();let fits=true;a.updateWorldMatrix(true,true);a.traverse(m=>{if(!m.isMesh||!m.geometry)return;const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).project(s.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1)fits=false;}});return fits;});})()`);
 assert.ok(await checkFraming(),'both complete characters fit ceremony view');
 if(mobile){for(const [width,height] of [[320,568],[844,390],[390,844]]){await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await wait(1400);assert.ok(await checkFraming(),'full-body framing after orientation/size change');const r=await ev(`(()=>{const r=document.querySelector('.cake-blow-button').getBoundingClientRect();return{top:r.top,bottom:r.bottom}})()`);assert.ok(r.top>=0&&r.bottom<=height);}}
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../cake-ceremony-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(shot.result.data,'base64'));
 await pointerTap('.cake-blow-button',mobile);assert.equal(await ev('c.phase'),'blowing');assert.equal(await ev('!!document.querySelector(".cake-blow-button")'),false);
 assert.equal(await ev(`(async()=>{const m=await import('/src/lib/cake.ts');return m.blowCakeCandles(c)})()`),false,'repeated blow rejected');
 await until('c.phase==="finished"',6);await ev('watch=false');
 assert.ok(await ev('samples.every(p=>JSON.stringify(p.positions)===JSON.stringify(samples[0].positions))'),'neither character walks during positioning, lighting, wishing or blowing');
 assert.ok(await ev('samples.some(p=>p.eyes>.9)&&samples.some(p=>p.phase==="blowing"&&p.flame>0&&p.flame<1)'),'gentle eye closure and gradual extinction');
 assert.equal(await ev('s.scene.getObjectByName("cake-candle-light").intensity'),0);assert.equal(await ev('s.scene.getObjectByName("cake-wish-sparkles").visible'),false);
 assert.equal(await ev('s.scene.getObjectByName("cake-flames").children.some(o=>o.visible)'),false);
 assert.equal(await ev('!!document.querySelector(".ending-message")||!!document.querySelector(".cinema-bars")'),false,'stop before kiss and finale');
 const end=await positions();await wait(500);assert.deepEqual(await positions(),end,'both remain beside cake');
 await key('s',true);await wait(350);await key('s',false);await wait(200);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(end[0])}))>.1`),'player controls restored');
 await click('button[aria-label="Open museum menu"]');await ev(`Array.from(document.querySelectorAll('#museum-menu button')).find(b=>b.textContent.includes('Replay Our Story')).click()`);await until('!!document.querySelector(".intro-star")');assert.equal(await ev('c.phase'),'hidden');assert.equal(await ev('c.lit'),0);assert.equal(await ev('c.flame'),0);assert.equal(await ev('c.eyesClosed'),0);assert.equal(await ev('c.canBlow'),false);assert.equal(await ev('visitMarker'),12345);
 console.log('PASS '+(mobile?'mobile touch':'desktop mouse')+' ceremony positioning/collisions, movement lock, sequential flames, reading pause, guarded blow, extinction, restored controls and replay');
}
assert.deepEqual(errors,[]);console.log('ALL CAKE CEREMONY CHECKS PASSED');
} finally {await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
