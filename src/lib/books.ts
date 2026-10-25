import type { PhotoConfig } from '../config';

export const BOOKSHELF = { position: [-3.2, 0, 6.38] as [number, number, number], width: 4.06, depth: .7, height: 3.35 };
export interface BookConfig extends PhotoConfig {
  kind: 'book';
  author: string;
  thumbnail: string;
  sourceUrl: string;
  shelfPosition: [number, number, number];
}
// Real edition covers, kept intact. See public/books/SOURCES.md for provenance.
const titles = [
  ['moyurakkhi', 'ময়ূরাক্ষী', 'gif', '890/moyurakkhi-himu-series-er-1st-book'],
  ['himu', 'হিমু', 'gif', '1277/himu'],
  ['ebong-himu', 'এবং হিমু', 'jpg', '1323/ebong-himu'],
  ['nilpodmo', 'হিমুর হাতে কয়েকটি নীলপদ্ম', 'gif', '1191/himur-hate-koyekti-nilpodmo'],
  ['ditio-prohor', 'হিমুর দ্বিতীয় প্রহর', 'jpg', '1228/himur-ditio-prohor'],
  ['rupali-ratri', 'হিমুর রূপালী রাত্রি', 'jpg', '1251/himur-rupali-ratri'],
];
// Replace these short personal notes independently when your own lines are ready.
export const BOOK_NOTES: Record<string, string> = {
  'moyurakkhi': 'Some stories feel like the beginning of a beautiful memory. This one will always have a little place in ours.',
  'himu': 'A few pages, a quiet afternoon, and thoughts of you. A little memory to keep between these pages.',
  'ebong-himu': 'For the stories we talked about long after the last page. Our own little note will live here soon.',
  'nilpodmo': 'A small reminder of the books that brought us closer. There is a personal story waiting to be written here.',
  'ditio-prohor': 'Some books stay with us like a favourite conversation. This space is waiting for one of ours.',
  'rupali-ratri': 'For quiet evenings, favourite pages, and memories of us. A few words from our story will go here.',
};
export const BOOKS: BookConfig[] = titles.map(([id, title, extension, source], i) => {
  const x = (i % 3 - 1) * 1.18, y = i < 3 ? 2.39 : 1.22;
  return {
    id: `book-${id}`, kind: 'book', roomIndex: 0, title, author: 'হুমায়ূন আহমেদ', date: 'হিমু সিরিজ',
    caption: BOOK_NOTES[id],
    url: `/books/${id}.${extension}`, thumbnail: `/books/${id}-shelf.webp`,
    sourceUrl: `https://www.rokomari.com/book/${source}`,
    shelfPosition: [x, y, .36],
    position: [BOOKSHELF.position[0] - x, y, BOOKSHELF.position[2] - .36],
    rotation: [0, Math.PI, 0], lightPosition: [BOOKSHELF.position[0] - x, y + .6, 5.2],
  };
});
export const isBook = (item: PhotoConfig): item is BookConfig => item.kind === 'book';
