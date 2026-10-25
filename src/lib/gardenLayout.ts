// Shared anchors keep atmosphere details beside the existing flower clusters.
export const gardenFlowerBeds = [
  { x: 1.55, z: -1.7, count: 7, color: '#ef90b5', accent: '#ffe0db' },
  { x: 2.45, z: .8, count: 6, color: '#ffd59b', accent: '#fff0d5' },
  { x: -.65, z: 2.05, count: 7, color: '#bda2ed', accent: '#eedaff' },
  { x: -2.45, z: -.75, count: 7, color: '#e986a5', accent: '#ffcee0' },
  // Soft outer borders frame the couple; the central walk to the cake stays open.
  { x: 4.8, z: -1.65, count: 7, color: '#f399ac', accent: '#ffe1ca' },
  { x: -4.65, z: -1.9, count: 6, color: '#c4a3ec', accent: '#f3d3ef' },
  { x: 4.65, z: 1.7, count: 7, color: '#e786b0', accent: '#ffdfeb' },
  { x: -4.6, z: 1.5, count: 7, color: '#ffbf9d', accent: '#fff0d1' },
  { x: 1.5, z: 3.7, count: 6, color: '#bf9ee7', accent: '#f2d9ff' },
  { x: -2.6, z: 3.65, count: 7, color: '#ed8cac', accent: '#ffe3dc' },
  { x: 3.85, z: -3.75, count: 7, color: '#f4adba', accent: '#fff0d6' },
  { x: -4.15, z: -3.55, count: 6, color: '#dba1dc', accent: '#ffcfdf' },
];

export const GARDEN_CENTER_X = 58.625;
export const gardenOutline = (angle: number) => 7.6 * (1 + .085 * Math.sin(3 * angle + .6) + .045 * Math.cos(5 * angle - .9) + .025 * Math.sin(2 * angle));
export function constrainGardenPosition(position: { x: number; z: number }, margin = .6) {
  const x = position.x - GARDEN_CENTER_X, z = position.z / .76;
  const radius = Math.hypot(x, z), limit = gardenOutline(Math.atan2(z, x)) - margin;
  if (radius > limit) { position.x = GARDEN_CENTER_X + x * limit / radius; position.z = z * .76 * limit / radius; }
}
