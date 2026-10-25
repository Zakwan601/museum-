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
 await until('!!document.querySelector(".cake-invitation")',28);
 await ev(`(async()=>{const fiber=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);const f=fiber._roots.get(document.querySelector('canvas')).fiber.current;const walk=n=>{if(!n)return;const p=n.memoizedProps;if(p?.cake&&p?.onCakeChange)window.sceneProps=p;walk(n.child);walk(n.sibling)};walk(f);window.c=sceneProps.cake;})()`);
 assert.equal(await ev('c.phase'),'inviting');
 assert.equal(await ev('c.lit'),0);
 await ev(`(async()=>{const {CAKE}=await import('/src/lib/cake.ts');window.cakePosition=CAKE.position;})()`);await decorationCheck('invitation');

 // Walk the girl all the way to the cake with actual joystick/WASD input.
 await ev(`(async()=>{const {CAKE}=await import('/src/lib/cake.ts');window.cakePosition=CAKE.position;})()`);
 const walkStart=(await positions())[0];
 if(mobile){
 const steering=await ev(`(()=>{const direction=cakePosition.clone().sub(actors[0].position).setY(0).normalize(),az=sceneProps.cameraState.smoothedAzimuth,r=document.querySelector('.virtual-joystick').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,dx:(direction.x*Math.cos(az)-direction.z*Math.sin(az))*r.width*.32,dy:(direction.x*Math.sin(az)+direction.z*Math.cos(az))*r.width*.32};})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,x:steering.x,y:steering.y}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:3,x:steering.x+steering.dx,y:steering.y+steering.dy}]});await until('!!document.querySelector(".cake-wish-button")',6);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
 const dx=await ev(`(async()=>{const {CAMERA}=await import('/src/config.ts');const desired=Math.atan2(actors[0].position.x-cakePosition.x,actors[0].position.z-cakePosition.z);return -(desired-sceneProps.cameraState.azimuth)/CAMERA.rotationSensitivity;})()`);
 await call('Input.dispatchMouseEvent',{type:'mousePressed',x:550,y:240,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:550+dx,y:240,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:550+dx,y:240,button:'left',clickCount:1});await wait(700);
 await key('w',true);await until('!!document.querySelector(".cake-wish-button")',6);await key('w',false);
 }
 await wait(250);assert.ok(await ev(`actors[0].position.distanceTo(new T.Vector3(...${JSON.stringify(walkStart)}))>3`),'girl approaches using player controls');
 await until('!!document.querySelector(".cake-wish-button")');
 await pointerTap('.cake-wish-button',mobile);
 assert.equal(await ev('c.phase'),'positioning');assert.equal(await ev('!!document.querySelector(".cake-wish-button")'),false);
 assert.equal(await ev(`(async()=>{const m=await import('/src/lib/cake.ts');return m.startCakeCeremony(c)})()`),false,'duplicate start rejected');
 await ev(`window.samples=[];window.watch=true;window.monitor=()=>{if(!watch)return;const light=s.scene.getObjectByName('cake-candle-light');samples.push({phase:c.phase,lit:c.lit,flame:c.flame,eyes:c.eyesClosed,light:light.intensity,gap:actors[0].position.distanceTo(actors[1].position),cakeGap:actors[0].position.distanceTo(cakePosition),boyGap:actors[1].position.distanceTo(cakePosition),positions:actors.map(a=>a.position.toArray())});requestAnimationFrame(monitor)};monitor()`);
 await until('c.phase==="lighting"',20);
 assert.ok(await ev('samples.every(p=>p.gap>=1.025&&p.cakeGap>=.999&&p.boyGap>=.999)'),'characters never intersect each other or pedestal');
 await key('w',true);const stationary=await positions();await wait(300);await key('w',false);assert.deepEqual(await positions(),stationary,'normal controls locked during ceremony');
 await until('c.phase==="wish"',8);await wait(1200);await decorationCheck('candles');
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
 await until('c.phase==="kissPause"',6);

 const beforeAlignment=await positions();
 await ev(`window.stageSamples=[];window.stageWatch=true;window.stageTick=()=>{if(!stageWatch)return;stageSamples.push({phase:c.phase,kiss:sceneProps.kiss.active,elapsed:sceneProps.kiss.elapsed,flame:c.flame,lit:c.lit,heart:s.scene.getObjectByName('golden-heart-constellation').visible,positions:actors.map(a=>a.position.toArray()),gap:actors[0].position.distanceTo(actors[1].position),cakeGap:Math.min(...actors.map(a=>a.position.distanceTo(cakePosition)))});requestAnimationFrame(stageTick)};stageTick()`);
 await until('c.phase==="kissing"',20);
 assert.equal(await ev('c.flame'),0);assert.equal(await ev('c.lit'),0);
 assert.deepEqual((await positions())[0],beforeAlignment[0],'girl never auto-walks');
 assert.ok(await ev('stageSamples.every(p=>p.gap>=1.025&&p.cakeGap>=.999)'),'boy alignment avoids girl and cake');
 assert.equal(await ev('s.scene.getObjectByName("golden-heart-constellation").visible'),false);
 await until('sceneProps.kiss.elapsed>2.5');
 await decorationCheck('kiss');
 const mouthGap=await ev(`(()=>{s.scene.updateMatrixWorld(true);return actors[0].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()).distanceTo(actors[1].getObjectByName('chibi-mouth').getWorldPosition(new T.Vector3()));})()`);assert.ok(mouthGap<.006,'existing actual kiss contact');
 assert.ok(await ev('s.scene.getObjectByName("anniversary-rose-bouquet").visible'),'bouquet preserved through kiss');
 await until('c.phase==="constellation"',12);
 assert.equal(await ev('sceneProps.kiss.active'),false,'heart waits for real kiss completion');
 await until('c.phase==="heartHold"',10);await wait(1200);await ev('watch=false;stageWatch=false');
 assert.ok(await ev('stageSamples.filter(p=>p.phase==="kissing").every(p=>!p.heart)'),'no overlapping kiss and constellation');
 assert.ok(await ev('stageSamples.filter(p=>p.phase==="kissing").every((p,i,a)=>JSON.stringify(p.positions)===JSON.stringify(a[0].positions))'),'feet fixed throughout existing kiss');
 assert.equal(await ev('!!document.querySelector(".ending-message")'),false,'Step 4 final message remains hidden');
 assert.ok(await ev('s.scene.getObjectByName("golden-heart-constellation").visible'),'one visible completed heart');
 assert.equal(await ev('s.scene.getObjectsByProperty("name","golden-heart-constellation").length'),1);
 assert.equal(await ev('s.scene.getObjectByName("golden-heart-constellation").children[3].geometry.drawRange.count'),64);
 await decorationCheck('constellation');
 const heartFrame=await ev(`(()=>{const g=s.scene.getObjectByName('golden-heart-constellation');s.camera.updateMatrixWorld();return g.children.slice(0,3).every(o=>{const a=o.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).project(s.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1)return false;}return true;});})()`);assert.ok(heartFrame,'heart fully in frame');
 const endingShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../cake-heart-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(endingShot.result.data,'base64'));

 await until('!!document.querySelector(".ending-message")',12);
 assert.equal(await ev('sceneProps.ending.phase'),'complete');assert.equal(await ev('c.heartProgress'),1);
 assert.equal(await ev('document.querySelectorAll(".ending-message").length'),1);
 assert.equal(await ev('document.querySelector("#ending-title").textContent'),'Happy 7 year AnniversaryMy sweetest baby girl');
 await wait(1700);
 assert.equal(await ev('getComputedStyle(document.querySelector(".ending-message")).animationName'),'ending-appear');
 const stable=await snapshot();await key('w',true);await wait(500);await key('w',false);assert.deepEqual(await snapshot(),stable,'completed actor and camera transforms stay frozen');
 assert.ok(await ev('s.scene.getObjectByName("golden-heart-constellation").visible'),'heart retained behind ending');
 assert.ok(await ev('s.scene.getObjectByName("golden-heart-constellation").children[0].material.opacity<.3'),'heart softened to preserve message readability');
 assert.ok(await ev('!!document.querySelector(`button[aria-label="Pause music"]`)'),'music continues without replaying');
 for(const [width,height] of (mobile?[[390,844],[320,568],[844,390]]:[[1100,850]])){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await wait(650);
 const fit=await ev(`(()=>{const r=document.querySelector('.ending-message').getBoundingClientRect(),b=document.querySelector('.ending-message>button').getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:innerHeight,width:innerWidth,button:[b.width,b.height],overflow:document.documentElement.scrollWidth>innerWidth};})()`);
 assert.ok(fit.top>=0&&fit.bottom<=fit.height&&fit.left>=0&&fit.right<=fit.width&&!fit.overflow&&fit.button[0]>=44&&fit.button[1]>=44,'original ending fits viewport');
 }
 const finalShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('../complete-ending-'+(mobile?'mobile':'desktop')+'.png',Buffer.from(finalShot.result.data,'base64'));
 // Existing collected-memory access still opens the original content.
 await ev(`document.querySelector('.ending-memory-access button').click()`);await until('!!document.querySelector(".photo-modal")');assert.equal(await ev('document.querySelector("#photo-title").textContent'),memoryTitle);await click('button[aria-label="Close"]');
 await pointerTap('.ending-message>button',mobile);await until('!!document.querySelector(".intro-star")');
 assert.equal(await ev('c.phase'),'hidden');assert.equal(await ev('c.heartProgress'),0);assert.equal(await ev('c.alignmentPlanned'),false);assert.equal(await ev('c.lit'),0);assert.equal(await ev('c.flame'),0);assert.equal(await ev('c.canBlow'),false);assert.equal(await ev('sceneProps.ending.phase'),'exploring');assert.equal(await ev('sceneProps.kiss.active'),false);assert.equal(await ev('!!document.querySelector(".ending-message")||!!document.querySelector("canvas")'),false);assert.equal(await ev('visitMarker'),12345);await wait(700);assert.equal(await ev('!!document.querySelector(".ending-message")'),false,'no stale callback after replay');
 // Fresh playthrough starts in School Days with no candle/message state.
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('.intro-star');await until('!!document.querySelector(".intro-enter")',10);await click('.intro-enter');await wait(1500);await call('Emulation.setEmulatedMedia',{features:[]});await setup();assert.ok(await ev('document.querySelector(".museum-location").textContent.includes("School Days")'));assert.equal(await ev('!!s.scene.getObjectByName("golden-heart-constellation")'),false);await key('w',true);await wait(300);await key('w',false);
 console.log('PASS '+(mobile?'mobile touch':'desktop mouse')+' complete player-led cake/kiss/heart/original-message sequence, final freeze, memory/music preservation, responsive layout and replay');
}
assert.deepEqual(errors,[]);console.log('ALL COMPLETE ENDING CHECKS PASSED');
} finally {await call('Emulation.setEmulatedMedia',{features:[]});ws.close();}
