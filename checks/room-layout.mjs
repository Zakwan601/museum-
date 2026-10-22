import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = text => ts.transpileModule(text, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const uri = text => 'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const config = uri(compile(fs.readFileSync('src/config.ts','utf8')));
const source = compile(fs.readFileSync('src/lib/museumLayout.ts','utf8')).replace(/(['"])\.\.\/config\1/g,JSON.stringify(config));
const {MUSEUM_ROOMS,MUSEUM_WALLS,MUSEUM_FURNITURE,constrainMuseumPosition,cameraWallDistance,museumRoomAt} = await import(uri(source));
assert.deepEqual(MUSEUM_ROOMS.map(r=>r.name),['School Days','College Days','University Life','Outro']);
for(const base of [0,22,44]){
  const point={x:base+8,z:0};for(let i=0;i<60;i++){point.x+=.14;constrainMuseumPosition(point);}assert.ok(point.x>base+14,'forward opening');
  for(let i=0;i<60;i++){point.x-=.14;constrainMuseumPosition(point);}assert.ok(point.x<base+9,'reverse opening');
  const blocked={x:base+8,z:3};for(let i=0;i<50;i++){blocked.x+=.14;constrainMuseumPosition(blocked);}assert.ok(Math.abs(blocked.x-(base+9.1))<.001,'solid wall blocks');
  const corridor={x:base+11,z:0};for(let i=0;i<50;i++){corridor.z+=.14;constrainMuseumPosition(corridor);}assert.ok(corridor.z<=1.20001,'passage side blocks');
  assert.ok(cameraWallDistance({x:base+8,z:0},1,0,6)>4,'camera sees through opening');
  assert.ok(cameraWallDistance({x:base+8,z:3},1,0,6)<2,'camera stops before solid wall');
}
const end={x:0,z:0};for(let i=0;i<900;i++){end.x+=.14;constrainMuseumPosition(end);}assert.ok(Math.abs(end.x-75.1)<.001);assert.equal(museumRoomAt(end.x).name,'Outro');for(let i=0;i<900;i++){end.x-=.14;constrainMuseumPosition(end);}assert.ok(Math.abs(end.x+9.1)<.001);
// Every near-wall sample resolves outside the solid wall volumes.
for(let x=-10;x<=76;x+=.37)for(let z=-7;z<=7;z+=.43){const p={x,z};constrainMuseumPosition(p);for(const w of [...MUSEUM_WALLS,...MUSEUM_FURNITURE]){const dx=p.x-Math.max(w.position[0]-w.size[0]/2,Math.min(w.position[0]+w.size[0]/2,p.x));const dz=p.z-Math.max(w.position[2]-w.size[2]/2,Math.min(w.position[2]+w.size[2]/2,p.z));assert.ok(Math.hypot(dx,dz)>=.7499,'sample resolves out of walls and furniture');}}
console.log('PASS four-room layout, all openings both ways, wall/jamb collision samples, corridor sides, outer bounds, and camera clearance');
