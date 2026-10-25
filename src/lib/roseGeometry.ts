import * as THREE from 'three';

// Curved, overlapping petals form open roses without textures or model downloads.
function roseGeometry() {
  const vertices: number[] = [], indices: number[] = [];
  for (let layer = 0; layer < 3; layer++) for (let petal = 0; petal < 6 - layer; petal++) {
    const start = vertices.length / 3, angle = petal * Math.PI * 2 / (6 - layer) + layer * .7;
    for (let row = 0; row <= 5; row++) for (let col = 0; col <= 4; col++) {
      const t = row / 5, u = col / 4 * 2 - 1;
      const r = (.06 - layer * .018) * (.25 + .75 * Math.sin(t * Math.PI * .65));
      const a = angle + u * (.2 + t * .65);
      vertices.push(Math.cos(a) * r, t * (.055 + layer * .005) - Math.abs(u) ** 2 * t * .013, Math.sin(a) * r);
    }
    for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) {
      const a = start + row * 5 + col, b = a + 5; indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
export const rose = roseGeometry();
