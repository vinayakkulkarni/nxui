export interface BanknoteBentoItem {
  /** Engraving/etching scan URL. Thermal cards must be CORS-readable. */
  src: string;
  /** Caption rendered in serif over the card. Typed on thermal cards. */
  caption?: string;
  /** Caption corner. */
  captionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Caption color override (defaults to the paper color). */
  captionColor?: string;
  /** Ink color for the duotone (dark engraving lines), e.g. `#4c1d95`. */
  ink?: string;
  /** Grid footprint. `wide` spans two columns, `tall` spans two rows. */
  span?: 'wide' | 'tall' | 'square';
  /** Show an App Store chip in the bottom-right corner. */
  storeBadge?: boolean;
  /** Run the thermal-camera cycle on this card (rainbow heat remap). */
  thermal?: boolean;
  /** Image focal point as `x% y%` (cover crop anchor). */
  focus?: string;
  /** Extra zoom into the focal point (e.g. `1.6` for a tight portrait crop). */
  zoom?: number;
}

export interface BanknoteBentoProps {
  /** Cards, placed in order into the grid. */
  items: BanknoteBentoItem[];
  /** Paper color shared by all duotones. */
  paper?: string;
  /** Seconds for one full thermal rise-and-fall cycle. */
  thermalCycle?: number;
  class?: string;
}

export interface BanknoteBentoThermalProps {
  /** Engraving scan URL (must be CORS-readable for canvas pixel access). */
  src: string;
  /** Ink color of the cold duotone state. */
  ink?: string;
  /** Paper color of the cold duotone state. */
  paper?: string;
  /** Seconds for one full rise-and-fall cycle. */
  cycle?: number;
  /** Caption typed out while the card runs hot. */
  caption?: string;
  /** Image focal point as `x% y%` (cover crop anchor). */
  focus?: string;
}
