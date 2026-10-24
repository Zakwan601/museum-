// Shared anchors keep atmosphere details beside the existing flower clusters.
export const gardenFlowerBeds = [
  { x: 1.55, z: -1.7, count: 6, color: '#e6b6c8', accent: '#f4d4df' },
  { x: 2.45, z: .8, count: 5, color: '#f1dfaf', accent: '#faf0ce' },
  { x: -.65, z: 2.05, count: 7, color: '#c5bcdf', accent: '#e0d5ef' },
  { x: -2.45, z: -.75, count: 5, color: '#dcadc1', accent: '#f1cfda' },
];

export const GARDEN_CENTER_X = 58.625;
export const gardenOutline = (angle: number) => 7.6 * (1 + .085 * Math.sin(3 * angle + .6) + .045 * Math.cos(5 * angle - .9) + .025 * Math.sin(2 * angle));
export function constrainGardenPosition(position: { x: number; z: number }, margin = .6) {
  const x = position.x - GARDEN_CENTER_X, z = position.z / .76;
  const radius = Math.hypot(x, z), limit = gardenOutline(Math.atan2(z, x)) - margin;
  if (radius > limit) { position.x = GARDEN_CENTER_X + x * limit / radius; position.z = z * .76 * limit / radius; }
}
