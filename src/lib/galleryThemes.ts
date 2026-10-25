export const GALLERY_THEMES = {
  college: { wall: '#a1849e', ceiling: '#57445d', floor: '#684951', trim: '#edd4df', gold: '#c6a56e', fabric: '#ae829e', panel: '#896b85', light: '#ffe0d8' },
  university: { wall: '#e8c7b6', ceiling: '#b18b83', floor: '#a47b68', trim: '#fff0d6', gold: '#b8995e', fabric: '#d6a194', panel: '#d1ac9b', light: '#ffcf8c' },
};
export function structureColors(id: string) {
  if (id.startsWith('college')) return GALLERY_THEMES.college;
  if (id.startsWith('university')) return GALLERY_THEMES.university;
  return id.startsWith('school')
    ? { wall: '#dbb5c4', ceiling: '#8b667b', floor: '#765660', trim: '#e6c9cb', gold: '#c4a26a' }
    : { wall: '#c6bfc7', ceiling: '#a49ba4', floor: '#777078', trim: '#eadfe2', gold: '#c4a26a' };
}
