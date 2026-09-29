import type { ButtonEra } from './types';

/** Minor ticks drawn between two labelled eras, plus one. */
export const TICKS_PER_ERA = 4;

export const ERAS: ButtonEra[] = [
  { year: 1986, surface: 'era-1986', font: 'pixel' },
  { year: 1988, surface: 'era-1986', font: 'pixel' },
  { year: 1990, surface: 'era-1990', font: 'pixel' },
  { year: 1994, surface: 'era-1994', font: 'pixel' },
  { year: 2000, surface: 'era-2000', font: 'classic' },
  { year: 2002, surface: 'era-2002', font: 'classic' },
  { year: 2004, surface: 'era-2004', font: 'classic' },
  { year: 2007, surface: 'era-2007', font: 'classic' },
  { year: 2010, surface: 'era-2010', font: 'classic' },
  { year: 2011, surface: 'era-2011', font: 'classic' },
  { year: 2012, surface: 'era-2012', font: 'classic' },
  { year: 2018, surface: 'era-2018', font: 'modern' },
  { year: 2022, surface: 'era-2022', font: 'modern' },
  { year: 2023, surface: 'era-2023', font: 'modern', light: true },
  { year: 2026, surface: 'era-2026', font: 'modern', light: true },
];

/** Height of a timeline tick, as a 0–1 share, for a bell curve around `position`. */
export function tickLevel(tick: number, position: number): number {
  const distance = tick / TICKS_PER_ERA - position;
  return Math.exp(-(distance * distance) / (2 * 2.6 * 2.6));
}

let audio: AudioContext | null = null;

/** A short detent click; needs a prior user gesture to be audible. */
export function playClick(year: number): void {
  audio ??= new AudioContext();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  // Older eras click lower and squarer, newer ones higher and softer.
  const age = (year - 1986) / 40;
  osc.type = age < 0.4 ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(900 + age * 1500, now);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}
