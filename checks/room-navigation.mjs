import assert from 'node:assert/strict';
import fs from 'node:fs';
const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ws = new WebSocket(tabs.find(p => p.url === 'http://127.0.0.1:5173/').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve));
let id = 0;
const pending = new Map(), errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
});
const call = (method, params = {}) => new Promise(resolve => {
  const next = ++id; pending.set(next, resolve); ws.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async expression => {
  const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.result.exceptionDetails) throw Error(JSON.stringify(response.result.exceptionDetails));
  return response.result.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const touch = (type, points) => call('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, x, y]) => ({ id, x, y, radiusX: 4, radiusY: 4 })) });
const key = (key, down) => call('Input.dispatchKeyEvent', { type: down ? 'keyDown' : 'keyUp', key, code: `Key${key.toUpperCase()}` });
const names = ['School Days', 'College Days', 'University Life', 'Outro'];
try {
  await call('Runtime.enable'); errors.length = 0;
  for (const mobile of [false, true]) {
    await call('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await call('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
    await call('Page.reload'); await wait(1800);
    await evaluate(`(async()=>{
      const fiber=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);
      let root;for(let i=0;i<100&&!(root=fiber._roots.get(document.querySelector('canvas')));i++)await new Promise(r=>setTimeout(r,100));
      window.state=root.store.getState();
      window.actors=state.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Group'&&c.children.some(m=>m.geometry?.type==='LatheGeometry')));
      window.layout=await import('/src/lib/museumLayout.ts');
      window.cameraInsideWall=()=>layout.MUSEUM_WALLS.some(w=>Math.abs(state.camera.position.x-w.position[0])<w.size[0]/2+.035&&Math.abs(state.camera.position.z-w.position[2])<w.size[2]/2+.035);
    })()`);
    assert.equal(await evaluate('state.scene.getObjectByName("museum-structure").children.filter(c=>c.name.startsWith("room-")).length'), 4);
    for (const direction of [1, -1]) for (const index of direction > 0 ? [0, 1, 2] : [2, 1, 0]) {
      const start = 22 * index + (direction > 0 ? 8 : 14);
      await evaluate(`actors[0].position.set(${start},0,0);actors[1].position.set(${start - direction * 1.05},0,-.3)`);
      await wait(900);
      if (mobile) { await touch('touchStart', [[1, 70, 772]]); await touch('touchMove', [[1, 70 + direction * 36, 772]]); }
      else await key(direction > 0 ? 'd' : 'a', true);
      for (let sample = 0; sample < 17; sample++) { await wait(150); assert.equal(await evaluate('cameraInsideWall()'), false, 'camera must not enter doorway walls'); }
      if (mobile) await touch('touchEnd', []); else await key(direction > 0 ? 'd' : 'a', false);
      await wait(900);
      const result = JSON.parse(await evaluate('JSON.stringify({positions:actors.map(a=>a.position.toArray()),room:document.querySelector(".museum-location").innerText})'));
      const destination = direction > 0 ? index + 1 : index;
      console.log(mobile ? 'Joystick' : 'WASD', direction > 0 ? 'forward' : 'back', names[destination], result.positions);
      assert.ok(result.room.includes(names[destination]), 'room indicator updates');
      assert.ok(result.positions.every(p => direction > 0 ? p[0] > index * 22 + 12 : p[0] < index * 22 + 10), 'both characters cross the passage');
    }
    console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: every connection in both directions, companion and camera clearance`);
  }
  // Check preserved cinematics far from the original origin.
  await evaluate('actors[0].position.set(66,0,0);actors[1].position.set(67.05,0,-.3)'); await wait(1000);
  await evaluate('document.querySelector(`button[aria-label="Pose together for a photo"]`).click()'); await wait(2500);
  assert.ok(await evaluate('actors.every(a=>a.position.x>56)'), 'portrait stays in Outro');
  const shot = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('../four-rooms-outro.png', Buffer.from(shot.result.data, 'base64'));
  await evaluate('document.querySelector(`button[aria-label="Return to walking"]`).click()'); await wait(4200);
  assert.ok(Math.abs(await evaluate('actors[0].position.x') - 66) < .01);
  await evaluate('document.querySelector(`button[aria-label="Share a kiss"]`).click()'); await wait(2600);
  assert.ok(await evaluate('actors.every(a=>a.position.x>56)'), 'kiss stays in Outro'); await wait(6300);
  assert.ok(await evaluate('!document.querySelector(`button[aria-label="Share a kiss"]`).disabled'));
  assert.ok(Math.abs(await evaluate('actors[0].position.x') - 66) < .01);
  assert.deepEqual(errors, []); console.log('PASS Outro photo pose, kiss, position restoration, no runtime exceptions');
} finally {
  await touch('touchCancel', []); await call('Page.reload'); ws.close();
}
