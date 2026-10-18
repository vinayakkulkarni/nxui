import type {
  WheelCarouselItem,
  WheelCarouselPalette,
  WheelCarouselPhotoAspect,
} from './types';

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

export const wheelCarouselDefaultItems: WheelCarouselItem[] = [
  { label: 'Halcyon Fields', image: unsplash('1520529890308-f503006340b4') },
  { label: 'Meridian House', image: unsplash('1483366774565-c783b9f70e2c') },
  { label: 'Norlight Pavilion', image: unsplash('1496865534669-25ec2a3a0fd3') },
  { label: 'Aperture Studio', image: unsplash('1549791084-5f78368b208b') },
  { label: 'Solene Tower', image: unsplash('1534094830444-3a1e21f7e3e7') },
  { label: 'Verdant Mile', image: unsplash('1622396481322-3b83d186701b') },
  { label: 'Cobalt Works', image: unsplash('1602128110234-2d11c0aaadfe') },
  { label: 'Lumen Atrium', image: unsplash('1522404419647-18cb51cc5c7a') },
  { label: 'Marlowe Residence', image: unsplash('1576831371356-d6e9411ae501') },
  { label: 'Ostara Gallery', image: unsplash('1738844153732-a485f0e78382') },
  { label: 'Quill & Stone', image: unsplash('1548248823-ce16a73b6d49') },
  { label: 'Everest Loft', image: unsplash('1665779736808-047a6bbf43a0') },
  { label: 'Sable Courtyard', image: unsplash('1543067361-9bf996edf6ff') },
  { label: 'Ridgeline Retreat', image: unsplash('1592274951725-1688461e2019') },
  { label: 'Aurelia Plaza', image: unsplash('1599669846660-945c5c775181') },
  { label: 'Northwind Cabin', image: unsplash('1491406213019-05b162a72c20') },
  { label: 'Onyx Terrace', image: unsplash('1611570885483-095b1b449aa3') },
  { label: 'Palladium Hall', image: unsplash('1564566698730-9903b9e4a08c') },
  { label: 'Cirrus Offices', image: unsplash('1676144844767-b25cb5e6c896') },
  { label: 'Bramble Cottage', image: unsplash('1522743791393-522312deeebf') },
  { label: 'Vellum Library', image: unsplash('1628270680011-41792b21de87') },
  { label: 'Halden Bridge', image: unsplash('1478979464727-af7d24e18554') },
  { label: 'Ember & Ash', image: unsplash('1586073054612-fdd6537fc6d4') },
  { label: 'Slate Meridian', image: unsplash('1567505477286-9c7269119db7') },
];

export const wheelCarouselAspectRatios: Record<
  WheelCarouselPhotoAspect,
  string
> = {
  '3/4': '3 / 4',
  '1/1': '1 / 1',
  '4/3': '4 / 3',
  '3/2': '3 / 2',
};

export const wheelCarouselDarkPalette: WheelCarouselPalette = {
  background: '#000000',
  text: 'rgba(255, 255, 255, 0.5)',
  selected: '#ffffff',
  marker: '#2c6bff',
  panel: '#141414',
};

export const wheelCarouselLightPalette: WheelCarouselPalette = {
  background: '#ffffff',
  text: 'rgba(0, 0, 0, 0.32)',
  selected: '#0a0a0a',
  marker: '#2c6bff',
  panel: '#ededed',
};

export function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

/** Signed distance from the wheel's rotation to an item, wrapped to ±length/2. */
export function shortestOffset(
  index: number,
  rotation: number,
  length: number,
): number {
  let offset = index - rotation;
  while (offset > length / 2) offset -= length;
  while (offset < -length / 2) offset += length;
  return offset;
}
