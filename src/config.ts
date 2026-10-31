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
  kind?: 'book';
  roomIndex?: number;
  scale?: number;
  url: string;
  title: string;
  caption: string;
  date: string;
  position: [number, number, number];
  rotation: [number, number, number];
  lightPosition: [number, number, number];
}

const SCHOOL_PHOTOS: PhotoConfig[] = [
  {
    id: 'dance',
    url: 'https://ik.imagekit.io/iru/received_3181084138841705.webp?updatedAt=1793385794706',
    title: 'Our First Photo Together',
    caption: 'Class party te tor amar first chobi hehe.',
    date: 'Novembers 1, 2019',
    position: [0, 2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [0, 2.2, -5.5],
  },
  {
    id: 'embrace',
    url: 'https://ik.imagekit.io/iru/received_1028805817896667.jpeg?updatedAt=1793385794712',
    title: 'Our First Dateeeee',
    caption: '',
    date: '',
    position: [-9.85, 2, 3],
    rotation: [0, Math.PI / 2, 0],
    lightPosition: [-8.5, 2.2, 3],
  },
  {
    id: 'walk',
    url: 'https://ik.imagekit.io/iru/received_6336221593119278.jpeg?updatedAt=1793385792780',
    title: 'Reception Type Vibe ',
    caption: '',
    date: '',
    position: [-9.85, 2, -3],
    rotation: [0, Math.PI / 2, 0],
    lightPosition: [-8.5, 2.2, -3],
  },
  {
    id: 'dinner',
    url: 'https://ik.imagekit.io/iru/received_2065811306915107.webp?updatedAt=1793385795580',
    title: 'School er bahire amar first jaoa',
    caption: 'Odin to onek bhoy paichilam je tor sathe jabonaaa, ar ekhon tor sathe chara karo sathe jabona',
    date: '',
    position: [9.85, 2, 4.55],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [8.5, 2.2, 4.55],
  },
  {
    id: 'hands',
    url: 'https://ik.imagekit.io/iru/received_204880795129092.jpeg?updatedAt=1793385799400',
    title: 'One of my favouriteee photo',
    caption: '',
    date: '',
    position: [9.85, 2, -4.55],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [8.5, 2.2, -4.55],
  },
  {
    id: 'school-6',
    roomIndex: 0,
    url: 'https://ik.imagekit.io/iru/received_1272962733086720.jpeg?updatedAt=1793385792062',
    title: 'Prem korar shurur din gula ',
    caption: 'I wish ebhabe e jeno khushi khushi thakish amar sathe shob shomoy',
    date: '',
    position: [3.2, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [3.2, 3.5, 5.5],
  },
];

// College Days: edit each photo's URL, text and placement directly here.
const COLLEGE_PHOTOS: PhotoConfig[] = [
  {
    id: 'college-0',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/received_988629651854546.jpeg?updatedAt=1793385796679',
    title: 'Tui ami dress change kore date e jetam tarpor, koto pagol chilam',
    caption: '',
    date: '',
    position: [17.7, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [17.7, 3.5, -5.5],
  },
  {
    id: 'college-1',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/received_2210147859140297.jpeg?updatedAt=1793385800370',
    title: 'First day of college',
    caption: '',
    date: '',
    position: [26.3, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [26.3, 3.5, -5.5],
  },
  {
    id: 'college-2',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/received_683210646089191.jpeg?updatedAt=1793385800510',
    title: 'First day of coaching',
    caption: 'Koto koto obhiman er por shesh mesh eksathe coaching korchilam amra, moja hoto onek',
    date: '',
    position: [17.7, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [17.7, 3.5, 5.5],
  },
  {
    id: 'college-3',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/received_799164484698069(1).jpeg?updatedAt=1793385801634',
    title: 'Hot couples hehehehe',
    caption: '',
    date: '',
    position: [26.3, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [26.3, 3.5, 5.5],
  },
  {
    id: 'college-4',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/DSC_0000033.jpg?updatedAt=1793385798130',
    title: 'Amrao bolte pari je button phone eo prem korechi ',
    caption: '',
    date: '',
    position: [31.85, 2.2, -4.55],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [30.5, 3.5, -4.55],
  },
  {
    id: 'college-5',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/received_578965320566010.jpeg?updatedAt=1793385793969',
    title: 'Ei chobi ta amader arek anniversary r',
    caption: 'Eidin amader jhogra choltesilo eto eto, oi time e koto okarone jhogra kortam amra',
    date: '',
    position: [31.85, 2.2, 4.55],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [30.5, 3.5, 4.55],
  },
  {
    id: 'college-6',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/20230314_143424.jpg?updatedAt=1793385803920',
    title: 'Movie dateee',
    caption: 'Amar eto eto favourite tor sathe movie dekha (also makeout kora hishhh)',
    date: '',
    position: [22, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [22, 3.5, -5.5],
  },
  {
    id: 'college-7',
    roomIndex: 1,
    url: 'https://ik.imagekit.io/iru/20230226_151402.jpg?updatedAt=1793385791860',
    title: 'College e thakte koto koto koto date kortam amra bhai',
    caption: '',
    date: '',
    position: [22, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [22, 3.5, 5.5],
  },
];
// University Life: edit each photo independently, including the final wall portrait.
const UNIVERSITY_PHOTOS: PhotoConfig[] = [
  {
    id: 'university-0',
    roomIndex: 2,
    scale: 1.12,
    url: 'https://ik.imagekit.io/iru/Messenger_creation_C8E1ACFD-F2D1-4C23-9E2E-C94423EE4A04.jpeg?updatedAt=1793385802108',
    title: 'Banijjo mela dateee, abar jabo ebar ok',
    caption: '',
    date: '',
    position: [38.6, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [38.6, 3.5, -5.5],
  },
  {
    id: 'university-1',
    roomIndex: 2,
    scale: 1.4,
    url: 'https://ik.imagekit.io/iru/Messenger_creation_11B10A3A-F36F-4DE5-8159-586C550501FA.jpeg?updatedAt=1793385802692',
    title: 'My hottest gf hehe',
    caption: '',
    date: '',
    position: [44, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [44, 3.5, -5.5],
  },
  {
    id: 'university-2',
    roomIndex: 2,
    scale: 1.12,
    url: 'https://ik.imagekit.io/iru/Messenger_creation_2B1696B3-E6E6-4B5D-A1E3-79DC680D546D.jpeg?updatedAt=1793385800392',
    title: 'Bhije bhije koto gula market e gechilam camera dekhte',
    caption: '',
    date: '',
    position: [49.4, 2.2, -6.85],
    rotation: [0, 0, 0],
    lightPosition: [49.4, 3.5, -5.5],
  },
  {
    id: 'university-3',
    roomIndex: 2,
    scale: 1.12,
    url: 'https://ik.imagekit.io/iru/20260730_202122.jpg?updatedAt=1793385798451',
    title: 'Late night dates - date na actually, but i just pray biye hoye jak ar amra eto eto rate ghurte pari',
    caption: 'I loved this night ride sooooooo soo much',
    date: '',
    position: [39.7, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [39.7, 3.5, 5.5],
  },
  {
    id: 'university-4',
    roomIndex: 2,
    scale: 1.12,
    url: 'https://ik.imagekit.io/iru/Messenger_shbdbx774-01BDA0EBD3C3.jpeg?updatedAt=1793385796528',
    title: 'Pura e jamai bou',
    caption: '',
    date: '',
    position: [48.3, 2.2, 6.85],
    rotation: [0, Math.PI, 0],
    lightPosition: [48.3, 3.5, 5.5],
  },
  {
    id: 'university-onward',
    roomIndex: 2,
    scale: 1.3,
    url: 'https://ik.imagekit.io/iru/Messenger_creation_3D1EEC52-5CB6-4917-90ED-24B1BD6539FF.jpeg?updatedAt=1793385794498',
    title: 'Khao san datesss',
    caption: 'Normal shob kichu o eto extraordinary hoye jay tor sathe ',
    date: '',
    position: [53.85, 2.2, -4.55],
    rotation: [0, -Math.PI / 2, 0],
    lightPosition: [52.5, 3.5, -4.55],
  },
];
export const PHOTOS: PhotoConfig[] = [...SCHOOL_PHOTOS, ...COLLEGE_PHOTOS, ...UNIVERSITY_PHOTOS];

export const MUSIC = {
  // Put your MP3 in public/music/, then set e.g. '/music/our-song.mp3'.
  url: '/music/our-song.mp3',
  title: 'Soft Music for Our Memories',
  artist: 'Ambient Memories',
};
