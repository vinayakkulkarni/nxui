export type HoloClothPreset = 'holo' | 'chrome' | 'black-cloth';

export type HoloClothQuality = 'high' | 'medium' | 'low';

export interface HoloClothProps {
  /** Material preset: iridescent holo foil, mirror chrome, or black cloth. */
  preset?: HoloClothPreset;
  /** Optional image URL draped onto the cloth (deforms with the fabric). */
  image?: string;
  /** Scene background color; 'transparent' clears it. */
  background?: string;
  /** Enable grab-and-drag on the cloth plus orbiting on empty space. */
  interactive?: boolean;
  /** Allow scroll-wheel zoom (off by default so embedded demos don't hijack page scroll). */
  zoom?: boolean;
  /** Render scale / MSAA / cloth resolution trade-off. */
  quality?: HoloClothQuality;
  class?: string;
}
