export interface BanknoteBentoItem {
  /** Engraving-style image URL. */
  src: string;
  /** Caption rendered in serif over the image. */
  caption?: string;
  /** Caption corner. */
  captionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Duotone tint color (e.g. `#7c3aed`). Ignored when `thermal` is set. */
  tint?: string;
  /** Grid footprint. `wide` spans two columns, `tall` spans two rows. */
  span?: 'wide' | 'tall' | 'square';
  /** Show an App Store chip in the bottom-right corner. */
  storeBadge?: boolean;
  /** Animate an ironbow thermal heat field dissolving over the image. */
  thermal?: boolean;
}

export interface BanknoteBentoProps {
  /** Cards, placed in order into the grid. */
  items: BanknoteBentoItem[];
  /** Seconds for one full thermal rise-and-fall cycle. */
  thermalCycle?: number;
  class?: string;
}

export interface BanknoteBentoThermalProps {
  /** Engraving-style image URL (must be CORS-readable for canvas). */
  src: string;
  /** Base duotone tint under the heat field. */
  tint?: string;
  /** Seconds for one full rise-and-fall cycle. */
  cycle?: number;
}
