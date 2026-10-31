export const GALLERY_THEMES = {
  college: { wall: '#b9a8c6', ceiling: '#76617e', floor: '#79606c', trim: '#f5e6ed', gold: '#c7aa7f', fabric: '#b59ab5', panel: '#9e88aa', light: '#ffe6dd' },
  university: { wall: '#e8c9b8', ceiling: '#b59189', floor: '#a17d6b', trim: '#fff1de', gold: '#c3a47a', fabric: '#dbb2a3', panel: '#cfad9c', light: '#ffe0b4' },
};
export function structureColors(id: string) {
  if (id.startsWith('college')) return GALLERY_THEMES.college;
  if (id.startsWith('university')) return GALLERY_THEMES.university;
  return id.startsWith('school')
    ? { wall: '#e3c2cc', ceiling: '#987b8d', floor: '#80606b', trim: '#f4dfd9', gold: '#c5a67c' }
    : { wall: '#c6bfc7', ceiling: '#a49ba4', floor: '#777078', trim: '#eadfe2', gold: '#c4a26a' };
}
