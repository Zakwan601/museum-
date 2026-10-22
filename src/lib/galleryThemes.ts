export const GALLERY_THEMES = {
  college: { wall: '#53647f', ceiling: '#26364e', floor: '#47332f', trim: '#e6dcc7', gold: '#c6a56e', fabric: '#253a60', panel: '#43536d', light: '#e0dcff' },
  university: { wall: '#efdfc4', ceiling: '#e2cba5', floor: '#b38d65', trim: '#fff0d6', gold: '#b8995e', fabric: '#eee1c9', panel: '#dac6a5', light: '#ffcf8c' },
};
export function structureColors(id: string) {
  if (id.startsWith('college')) return GALLERY_THEMES.college;
  if (id.startsWith('university')) return GALLERY_THEMES.university;
  return id.startsWith('school')
    ? { wall: '#dbb5c4', ceiling: '#8b667b', floor: '#765660', trim: '#e6c9cb', gold: '#c4a26a' }
    : { wall: '#c6bfc7', ceiling: '#a49ba4', floor: '#777078', trim: '#eadfe2', gold: '#c4a26a' };
}
