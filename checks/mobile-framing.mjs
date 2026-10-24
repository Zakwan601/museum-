import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const tab = tabs.find(p => p.url === 'http://127.0.0.1:5173/');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(), errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); });
const call = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
const wait = ms => new Promise(r => setTimeout(r, ms));
await call('Runtime.enable'); errors.length = 0;
await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await call('Page.reload'); await wait(2500);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]}); for(let i=0;i<100&&!await ev('!!document.querySelector(".intro-star")');i++)await wait(200); await ev('document.querySelector(".intro-star").click()'); await wait(250); await ev('document.querySelector(".intro-enter").click()'); await wait(2000); await call('Emulation.setEmulatedMedia',{features:[]});
console.log(await ev(`(async()=>{const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);window.s=f._roots.get(document.querySelector('canvas')).store.getState();window.actors=s.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));window.T=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/three.js')).name);window.measure=()=>{s.camera.updateMatrixWorld();return actors.map(a=>{a.updateWorldMatrix(true,true);let min=1e9,max=-1e9,left=1e9,right=-1e9;const v=new T.Vector3();a.traverse(m=>{if(m.isMesh&&m.geometry){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).project(s.camera);min=Math.min(min,v.y);max=Math.max(max,v.y);left=Math.min(left,v.x);right=Math.max(right,v.x);}}});return {heightPercent:(max-min)*50,top:(1-max)*innerHeight/2,bottom:(1-min)*innerHeight/2,left:(left+1)*innerWidth/2,right:(right+1)*innerWidth/2};});};return JSON.stringify({fov:s.camera.fov,pixelRatio:s.gl.getPixelRatio(),size:[innerWidth,innerHeight],characters:measure(),camera:s.camera.position.toArray(),drawCalls:s.gl.info.render.calls});})()`));
const shot = await call('Page.captureScreenshot', {format:'png'}); fs.writeFileSync('../mobile-portrait.png', Buffer.from(shot.result.data,'base64'));
const results=[];
for(const [width,height] of [[320,568],[430,932],[844,390],[768,1024],[1440,900]]) {
  await call('Emulation.setTouchEmulationEnabled',{enabled:width<1100,maxTouchPoints:5}); await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:width<1100}); await wait(1700);
  results.push(JSON.parse(await ev(`JSON.stringify({size:[innerWidth,innerHeight],fov:s.camera.fov,pixelRatio:s.gl.getPixelRatio(),characters:measure(),pageOverflow:document.documentElement.scrollWidth>innerWidth,joystick:(()=>{const r=document.querySelector('.virtual-joystick').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})(),actions:[...document.querySelectorAll('.museum-actions button')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})})`)));
}
for(const result of results){assert.equal(result.pageOverflow,false);assert.ok(result.actions.every(b=>b.w>=44&&b.h>=44));if(Math.min(...result.size)<600)assert.ok(result.characters.every(c=>c.heightPercent>=15&&c.heightPercent<=32&&c.top>=0&&c.bottom<=result.size[1]&&c.left>=0&&c.right<=result.size[0]));}assert.deepEqual(errors,[]);console.log(JSON.stringify(results,null,2));console.log('PASS responsive sizes, full-body framing, tap targets, no overflow or runtime exceptions');
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await wait(1200);for(const [x,z] of [[0,0],[0,-6.1],[0,6.1],[9.1,6.1]]){await ev('actors[0].position.set('+x+',0,'+z+');actors[1].position.set('+(x+(x>8?-1.05:1.05))+',0,'+(z-.35)+')');await wait(1600);console.log('Position',x,z,await ev('JSON.stringify({characters:measure(),camera:s.camera.position.toArray()})'));}await call('Page.reload');ws.close();

