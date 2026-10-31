import * as THREE from 'three';

// Share textures with the ending gallery; retain only a few unused frames.
interface Entry { refs: number; used: number; promise: Promise<THREE.Texture>; texture?: THREE.Texture }
const pools = new WeakMap<THREE.WebGLRenderer, Map<string, Entry>>();
const jobs: Array<() => Promise<void>> = [];
let working = false;
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    jobs.push(async () => { try { resolve(await job()); } catch (error) { reject(error); } });
    queueMicrotask(() => { void drain(); });
  });
}
async function drain() {
  if (working) return;
  working = true;
  try { while (jobs.length) await jobs.shift()!(); }
  finally { working = false; }
}
function discard(texture: THREE.Texture) {
  texture.dispose();
  const image = texture.image;
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
}
function trim(pool: Map<string, Entry>) {
  const unused = [...pool.entries()].filter(([, entry]) => !entry.refs && entry.texture).sort((a, b) => a[1].used - b[1].used);
  for (const [key, entry] of unused.slice(0, Math.max(0, unused.length - 4))) {
    discard(entry.texture!); pool.delete(key);
  }
}
export function photoTextureUrl(source: string, edge: number) {
  const url = new URL(source, window.location.href);
  if (url.hostname === 'ik.imagekit.io' && !url.searchParams.has('ik-s') && !url.searchParams.has('tr') && !url.pathname.includes('/tr:')) {
    url.searchParams.set('tr', `w-${edge},h-${edge},c-at_max,q-82`);
  } else if (url.hostname === 'images.pexels.com') {
    url.searchParams.set('w', String(edge)); url.searchParams.set('h', String(edge));
    url.searchParams.set('fit', 'max'); url.searchParams.set('q', '82');
  }
  return url.toString();
}
async function loadPhoto(url: string, edge: number, renderer: THREE.WebGLRenderer) {
  const image = new Image(); image.crossOrigin = 'anonymous'; image.decoding = 'async';
  image.src = url;
  await image.decode();
  const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale)), height = Math.max(1, Math.round(image.naturalHeight * scale));
  let pixels: ImageBitmap | HTMLCanvasElement;
  try {
    pixels = await createImageBitmap(image, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high', imageOrientation: 'flipY' });
  } catch {
    // Small, bounded fallback for browsers without bitmap resizing.
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d')!.drawImage(image, 0, 0, width, height); pixels = canvas;
  }
  const texture = new THREE.Texture(pixels);
  texture.flipY = !(typeof ImageBitmap !== 'undefined' && pixels instanceof ImageBitmap);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.userData.photoSource = url;
  texture.needsUpdate = true;
  // Decode and upload one bounded image at a time, on separate frames.
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  renderer.initTexture(texture);
  return texture;
}
export function acquirePhotoTexture(source: string, renderer: THREE.WebGLRenderer, compact: boolean) {
  const edge = compact ? 768 : 1024, url = photoTextureUrl(source, edge);
  let pool = pools.get(renderer);
  if (!pool) { pool = new Map(); pools.set(renderer, pool); }
  const cache = pool;
  let entry = cache.get(url);
  if (!entry) {
    const promise = enqueue(async () => {
      // Skip jobs whose room was left before loading began.
      if (!fresh.refs) throw new Error('Photo no longer displayed');
      const texture = await loadPhoto(url, edge, renderer);
      fresh.texture = texture; fresh.used = performance.now(); trim(cache);
      return texture;
    }).catch(error => { if (cache.get(url) === fresh) cache.delete(url); throw error; });
    const fresh: Entry = { refs: 0, used: performance.now(), promise };
    entry = fresh; cache.set(url, entry);
  }
  entry.refs++; entry.used = performance.now();
  let released = false;
  return {
    promise: entry.promise,
    release: () => { if (released) return; released = true; entry!.refs--; entry!.used = performance.now(); trim(cache); },
  };
}
