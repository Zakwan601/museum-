export const ROOM = {
  width: 20,
  depth: 14,
  height: 5,
  wallThickness: 0.3,
};

export const CHARACTER = {
  speed: 2.8,
  rotationSpeed: 8,
  radius: 0.5,
};

export const FLOWER_POSITIONS: [number, number, number][] = [[-5, 0, -5.5], [5, 0, -5.5], [-7, 0, 5.9], [7, 0, 5.9]];

export const CAMERA = {
  distance: 5,
  minPitch: 0.15,
  maxPitch: 1.3,
  angleLerp: 0.15,
  rotationSensitivity: 0.006,
  pitchSensitivity: 0.004,
  wallMargin: 0.35,
  lookHeight: 1.1,
  dragThreshold: 5,
  minY: 0.4,
  maxY: 4.6,
};

export interface PhotoConfig {
  id: string;
  url: string;
  title: string;
  caption: string;
  date: string;
  position: [number, number, number];
  rotation: [number, number, number];
  lightPosition: [number, number, number];
}

export const PHOTOS: PhotoConfig[] = [
  {
    id: 'dance',
    url: 'https://images.pexels.com/photos/32059122/pexels-photo-32059122.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Our First Dance',
    caption: 'The night we danced like no one was watching, under a sky painted in gold.',
    date: 'June 15, 2023',
    position: [0, 2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [0, 2.2, -5.5],
  },
  {
    id: 'embrace',
    url: 'https://images.pexels.com/photos/14106980/pexels-photo-14106980.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Golden Hour Embrace',
    caption: 'In your arms, every sunset feels like the first one we shared.',
    date: 'September 3, 2023',
    position: [-9.85, 2, 3],
    rotation: [0, Math.PI / 2, 0],
    lightPosition: [-8.5, 2.2, 3],
  },
  {
    id: 'walk',
    url: 'https://images.pexels.com/photos/1439251/pexels-photo-1439251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Walking Together',
    caption: 'Every path leads somewhere beautiful when we walk side by side.',
    date: 'April 22, 2023',
    position: [-9.85, 2, -3],
    rotation: [0, Math.PI / 2, 0],
    lightPosition: [-8.5, 2.2, -3],
  },
  {
    id: 'dinner',
    url: 'https://images.pexels.com/photos/6288706/pexels-photo-6288706.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Candlelight for Two',
    caption: 'The flicker of candles, the warmth of your smile — a perfect evening.',
    date: 'December 24, 2023',
    position: [9.85, 2, 3],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [8.5, 2.2, 3],
  },
  {
    id: 'hands',
    url: 'https://images.pexels.com/photos/10099212/pexels-photo-10099212.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    title: 'Hand in Hand',
    caption: 'Your hand in mine — the simplest gesture, the greatest comfort.',
    date: 'February 14, 2024',
    position: [9.85, 2, -3],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [8.5, 2.2, -3],
  },
];

export const MUSIC = {
  url: '',
  title: 'Whispers of Time',
  artist: 'Ambient Memories',
};
