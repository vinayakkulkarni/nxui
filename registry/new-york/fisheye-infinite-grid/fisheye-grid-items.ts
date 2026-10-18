import type { FisheyeGridItem } from './types';

const unsplash = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?w=900&q=85&auto=format&fit=crop`;

export const FISHEYE_GRID_ITEMS: FisheyeGridItem[] = [
  {
    image: unsplash('1514906689926-25ba6dcb584b'),
    alt: 'Soft motion-blurred portrait in pale light',
    title: 'Silver Veil',
    meta: '01',
  },
  {
    image: unsplash('1527630941-4a229fd674ab'),
    alt: 'Seated figure softened by vertical motion blur',
    title: 'Quiet Frame',
    meta: '02',
  },
  {
    image: unsplash('1568557412756-7d219873dd11'),
    alt: 'Figures moving through saturated orange light',
    title: 'Ember Transit',
    meta: '03',
  },
  {
    image: unsplash('1581892805885-73bdd91beff0'),
    alt: 'Monochrome portrait obscured by a moving hand',
    title: 'Soft Gesture',
    meta: '04',
  },
  {
    image: unsplash('1603786420263-ad59136a7409'),
    alt: 'Face stretched into warm horizontal motion',
    title: 'Amber Echo',
    meta: '05',
  },
  {
    image: unsplash('1610846202780-b4d9837371ea'),
    alt: 'Lone figure passing through a muted green field',
    title: 'Moss Passage',
    meta: '06',
  },
  {
    image: unsplash('1612592046138-1514dc06a1cd'),
    alt: 'Figure dissolving into cyan camera movement',
    title: 'Cyan Current',
    meta: '07',
  },
  {
    image: unsplash('1617281822114-9541b921a880'),
    alt: 'Dancers trailing across a dark stage',
    title: 'Phantom Chorus',
    meta: '08',
  },
  {
    image: unsplash('1619122656350-bde66c98e6a4'),
    alt: 'Soft figure receding into a warm cream background',
    title: 'Ivory Fade',
    meta: '09',
  },
  {
    image: unsplash('1624344965194-6aa6729ad832'),
    alt: 'Editorial portrait doubled in red and cyan light',
    title: 'Ionic Profile',
    meta: '10',
  },
  {
    image: unsplash('1633382148761-d56d55cee3cd'),
    alt: 'Monochrome portrait with hair caught in motion',
    title: 'Carbon Study',
    meta: '11',
  },
  {
    image: unsplash('1542320868-497d7aeaaa13'),
    alt: 'Pale flowers swept across a black background',
    title: 'Petal Trace',
    meta: '12',
  },
];

/** Arrow-key pan steps in CSS pixels, as [x, y] offsets. */
export const FISHEYE_KEY_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [42, 0],
  ArrowRight: [-42, 0],
  ArrowUp: [0, 42],
  ArrowDown: [0, -42],
};
