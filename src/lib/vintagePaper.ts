import * as THREE from 'three';

let paper: THREE.CanvasTexture | undefined;
// One small shared texture for every paper card; no per-frame texture work.
export function vintagePaperTexture() {
  if (paper) return paper;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const n = Math.sin(i * .127 + 31.7) * 43758.5453;
    const grain = (n - Math.floor(n)) * 6 - 3;
    pixels.data[i] = 247 + grain; pixels.data[i + 1] = 238 + grain; pixels.data[i + 2] = 218 + grain; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const age = ctx.createRadialGradient(132, 116, 60, 128, 128, 180);
  age.addColorStop(0, '#fff6d500'); age.addColorStop(1, '#b2967320'); ctx.fillStyle = age; ctx.fillRect(0, 0, 256, 256);
  ctx.lineWidth = .7;
  for (let i = 0; i < 9; i++) {
    const x = (i * 83) % 256, y = (i * 47) % 256;
    ctx.strokeStyle = i % 2 ? '#fff5df75' : '#ac947b18';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 23, y - 3); ctx.lineTo(x + 48, y + 1); ctx.stroke();
  }
  paper = new THREE.CanvasTexture(canvas); paper.colorSpace = THREE.SRGBColorSpace;
  return paper;
}
