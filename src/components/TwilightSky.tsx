import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const noRaycast = () => {};
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const skyGeometry = new THREE.SphereGeometry(110, 32, 16);
const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, dithering: true,
  uniforms: {
    indigo: { value: new THREE.Color('#111b39') },
    twilight: { value: new THREE.Color('#535e83') },
    below: { value: new THREE.Color('#566783') },
    warmth: { value: new THREE.Color('#ae8698') },
  },
  vertexShader: `varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    #include <common>
    #include <dithering_pars_fragment>
    varying vec3 vDirection;
    uniform vec3 indigo; uniform vec3 twilight; uniform vec3 below; uniform vec3 warmth;
    void main(){
      float h=normalize(vDirection).y;
      vec3 color=mix(twilight,indigo,smoothstep(-.48,.22,h));
      color=mix(below,color,smoothstep(-.85,-.46,h));
      float horizon=1.-smoothstep(0.,.23,abs(h+.37));
      color=mix(color,warmth,horizon*.35);
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <dithering_fragment>
    }`,
});

function radialTexture(halo = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = halo ? 128 : 32;
  const ctx = canvas.getContext('2d')!, r = canvas.width / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  if (halo) {
    gradient.addColorStop(0, 'rgba(255,227,193,.28)');
    gradient.addColorStop(.25, 'rgba(244,212,191,.17)');
    gradient.addColorStop(.55, 'rgba(198,185,220,.06)');
    gradient.addColorStop(1, 'rgba(170,185,220,0)');
  } else {
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.22, 'rgba(255,255,255,1)');
    gradient.addColorStop(.6, 'rgba(255,255,255,.42)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  }
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

// A connected, softly scalloped bank replaces individual ellipsoid cloud puffs.
// Only the silhouette and cross-section vary; there is no per-frame deformation.
function cloudBank(radius: number, width: number, base: number, height: number, phase: number, distance: number) {
  const steps = 160, rows = 11, positions: number[] = [], colors: number[] = [], uv: number[] = [], indices: number[] = [];
  const shade = new THREE.Color('#53648b').lerp(new THREE.Color('#7a86a7'), distance * .5);
  const light = new THREE.Color('#9ba8c6').lerp(new THREE.Color('#a9a7c0'), distance * .5);
  const opacity = [0, .035, .11, .25, .42, .52, .46, .32, .15, .035, 0];
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * Math.PI * 2;
    const crest = 1 + .18 * Math.sin(a * 7 + phase) + .08 * Math.cos(a * 11 - phase);
    const bend = Math.sin(a * 3 + phase) * width * .18;
    const swell = height * (.38 * Math.sin(a * 4 + phase) + .16 * Math.cos(a * 9 - phase));
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1), r = radius + bend + Math.sin(t * Math.PI) * width * .12;
      positions.push(Math.cos(a) * r, base + swell + (t - .5) * height * 2.8 * crest, Math.sin(a) * r);
      uv.push(i / steps, t);
      const color = shade.clone().lerp(light, THREE.MathUtils.smoothstep(t, .15, .85));
      colors.push(...color.toArray(), opacity[row] * (1 - distance * .2) * (.82 + .18 * Math.sin(a * 5 + phase)));
      if (i < steps && row < rows - 1) {
        const next = i + 1;
        indices.push(i * rows + row, next * rows + row, i * rows + row + 1, next * rows + row, next * rows + row + 1, i * rows + row + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeBoundingSphere(); return geometry;
}
const cloudGeometries = [cloudBank(19, 5.2, -5.4, 2.3, .4, 0), cloudBank(37, 7.5, -7.8, 2.5, 1.7, .45), cloudBank(62, 10, -10.5, 2.7, 3.2, .85)];
// One tiny, shared, baked alpha mask gives the banks overlapping soft billows.
// It adds one texture sample, not procedural noise or a simulation in the shader.
const cloudMask = (() => {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 64);
  const base = ctx.createLinearGradient(0, 0, 0, 64);
  base.addColorStop(0, '#000'); base.addColorStop(.5, '#555'); base.addColorStop(1, '#000');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 64);
  for (let i = -1; i < 18; i++) {
    const x = i * 16 + 7, y = 30 + 8 * Math.sin(i * 1.7), rx = 18 + 3 * Math.cos(i * 2.1), ry = 19 + 5 * Math.sin(i * 1.3);
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    const puff = ctx.createRadialGradient(-.12, -.18, .08, 0, 0, 1);
    puff.addColorStop(0, 'rgba(255,255,255,.85)'); puff.addColorStop(.48, 'rgba(245,245,245,.65)'); puff.addColorStop(1, 'rgba(200,200,200,0)');
    ctx.fillStyle = puff; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  const map = new THREE.CanvasTexture(canvas); map.wrapS = THREE.RepeatWrapping; return map;
})();
const cloudMaterial = new THREE.MeshBasicMaterial({ alphaMap: cloudMask, vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });

function ridge(x: number, z: number, width: number, base: number, tint: string) {
  const heights = [0, .8, 1.3, .7, 2.1, 3.3, 2.5, 1.4, 2, 1.1, 2.8, 3.7, 2.6, 1.7, 2.1, .9, .3, 0];
  const p: number[] = [], c: number[] = [], index: number[] = [];
  heights.forEach((height, i) => {
    const side = z + (i / (heights.length - 1) - .5) * width;
    p.push(x, base + height, side, x, base - 9, side);
    const edgeFade = Math.sin(i / (heights.length - 1) * Math.PI) ** 2;
    c.push(...new THREE.Color(tint).toArray(), .32 * edgeFade, ...new THREE.Color('#657490').toArray(), 0);
    if (i < heights.length - 1) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(c, 4)); geometry.setIndex(index); geometry.computeBoundingSphere(); return geometry;
}
const ridges = [ridge(-74, -32, 65, -11, '#485a7b'), ridge(-65, 34, 58, -11.5, '#526183')];
const ridgeMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const moonGeometry = new THREE.SphereGeometry(2.5, 24, 16);
const moonColors: number[] = [];
for (let i = 0; i < moonGeometry.attributes.normal.count; i++) {
  const n = moonGeometry.attributes.normal;
  const lit = THREE.MathUtils.clamp(.77 + n.getX(i) * .15 + n.getY(i) * .08 - n.getZ(i) * .1, .5, 1);
  moonColors.push(...new THREE.Color('#f7e8d3').multiplyScalar(lit).toArray());
}
moonGeometry.setAttribute('color', new THREE.Float32BufferAttribute(moonColors, 3));
const moonMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

export default function TwilightSky({ compact, reducedMotion, simple }: { compact: boolean; reducedMotion: boolean; simple: boolean }) {
  const materials = useRef<(THREE.PointsMaterial | null)[]>([]);
  const [dot, halo] = useMemo(() => [radialTexture(), radialTexture(true)], []);
  useEffect(() => () => { dot.dispose(); halo.dispose(); }, [dot, halo]);
  const stars = useMemo(() => [compact ? 240 : 430, compact ? 84 : 140, compact ? 16 : 28].map((count, layer) => {
    const geometry = new THREE.BufferGeometry(), positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const seed = i + layer * 1700, featured = i % 3 !== 0;
      const a = featured ? Math.PI + (seeded(seed + 1200) - .5) * 1.1 : seeded(seed + 1200) * Math.PI * 2;
      const y = seeded(seed + 2200) * (featured ? .7 : 1.15) - .22, r = Math.sqrt(1 - y * y);
      positions.set([Math.cos(a) * r * 90, y * 90, Math.sin(a) * r * 90], i * 3);
      const tint = new THREE.Color(['#d2ddff', '#f4dcb9', '#e8eaff'][(i + layer) % 3]);
      colors.set(tint.multiplyScalar(.38 + seeded(seed + 4000) * .62).toArray(), i * 3);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geometry.computeBoundingSphere(); return geometry;
  }), [compact]);
  useEffect(() => () => stars.forEach(g => g.dispose()), [stars]);
  useFrame(({ clock }) => {
    materials.current.forEach((material, i) => { if (material) material.opacity = reducedMotion || simple ? .88 : .84 + Math.sin(clock.elapsedTime * (.18 + i * .035) + i * 2.1) * .045; });
  });
  return <group name="twilight-sky">
    <mesh name="twilight-gradient" geometry={skyGeometry} material={skyMaterial} raycast={noRaycast} dispose={null} />
    <group name="universe-stars">{stars.map((geometry, i) => <points key={i} geometry={geometry} raycast={noRaycast}>
      <pointsMaterial ref={m => { materials.current[i] = m; }} map={dot} size={[.16, .3, .55][i]} vertexColors transparent opacity={.88} alphaTest={.015} depthWrite={false} />
    </points>)}</group>
    <group name="twilight-moon" position={[-55, 4, 14]}>
      <sprite scale={[12, 12, 1]} raycast={noRaycast}><spriteMaterial map={halo} transparent opacity={.85} depthWrite={false} toneMapped={false} /></sprite>
      <mesh geometry={moonGeometry} material={moonMaterial} raycast={noRaycast} dispose={null} />
    </group>
    {ridges.map((geometry, i) => <mesh key={i} name={`distant-ridge-${i}`} geometry={geometry} material={ridgeMaterial} raycast={noRaycast} dispose={null} />)}
    {cloudGeometries.map((geometry, i) => <mesh key={i} name={`cloud-bank-${i}`} geometry={geometry} material={cloudMaterial} raycast={noRaycast} dispose={null} />)}
  </group>;
}
