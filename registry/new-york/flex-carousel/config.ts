import type {
  FlexCarouselItem,
  FlexCarouselLensValues,
  FlexCarouselPreset,
} from './types';

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=max`;

export const DEFAULT_ITEMS: FlexCarouselItem[] = [
  {
    src: photo('photo-1737071371043-761e02b1ef95'),
    alt: 'An iridescent chrome sculpture of a head',
    title: 'Iridescence',
  },
  {
    src: photo('photo-1693645325828-62cd35c8da8f'),
    alt: 'A person in dark clothes standing in front of a white backdrop',
    title: 'White Room',
  },
  {
    src: photo('photo-1739056238917-d89cd05c48d5'),
    alt: 'A twisted chrome form on black',
    title: 'Liquid Metal',
  },
  {
    src: photo('photo-1747191092806-c7da11881986'),
    alt: 'A clay bust shown in profile',
    title: 'Clay Study',
  },
  {
    src: photo('photo-1605034313761-73ea4a0cfbf3'),
    alt: 'Black and white low top sneakers',
    title: 'Low Tops',
  },
  {
    src: photo('photo-1495462911434-be47104d70fa'),
    alt: 'A woman in a wide black hat',
    title: 'Brim',
  },
  {
    src: photo('photo-1786835568925-20cd20007ed0'),
    alt: 'Three swirling shapes in white, gold and silver on grey',
    title: 'Three Forms',
  },
  {
    src: photo('photo-1770249196550-ff6c641165cb'),
    alt: 'A chrome humanoid sculpture',
    title: 'Automaton',
  },
  {
    src: photo('photo-1787181875088-087d612262a7'),
    alt: 'A black textured sculpture with an opening at its center',
    title: 'Obsidian',
  },
  {
    src: photo('photo-1770062422885-2dfcbe8fb65b'),
    alt: 'A woman in a white shirt crouching on a dark set',
    title: 'Poise',
  },
  {
    src: photo('photo-1726910133626-9b573eca70ff'),
    alt: 'Black curved shapes stacked like a fan',
    title: 'Fins',
  },
  {
    src: photo('photo-1604854574958-59047362c165'),
    alt: 'A white plaster bust on a black table',
    title: 'Plaster',
  },
];

export const BEND_PRESETS: Record<FlexCarouselPreset, FlexCarouselLensValues> =
  {
    liquid: {
      lensWidth: 0.74,
      lensHeight: 1.18,
      tilt: 62,
      roundness: 1,
      bend: 0.34,
      reach: 0.38,
      curl: 'twist',
      dispersion: 0.45,
      liquid: 0,
      followCursor: false,
    },
    ribbon: {
      lensWidth: 0.8,
      lensHeight: 0.8,
      tilt: 0,
      roundness: 1,
      bend: 0.34,
      reach: 0.34,
      curl: 'twist',
      dispersion: 0.4,
      liquid: 0,
      followCursor: false,
    },
    vortex: {
      lensWidth: 0.7,
      lensHeight: 0.95,
      tilt: 30,
      roundness: 1,
      bend: 0.46,
      reach: 0.3,
      curl: 'twist',
      dispersion: 0.5,
      liquid: 0,
      followCursor: false,
    },
    arch: {
      lensWidth: 0.8,
      lensHeight: 0.8,
      tilt: 0,
      roundness: 1,
      bend: 0.3,
      reach: 0.36,
      curl: 'rise',
      dispersion: 0.4,
      liquid: 0,
      followCursor: false,
    },
  };
