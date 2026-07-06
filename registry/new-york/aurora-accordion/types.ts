export interface AuroraAccordionItem {
  /** Question / row title. */
  title: string;
  /** Answer body shown when expanded. */
  content: string;
  /** Optional leading icon (Iconify name, e.g. `lucide:sparkles`). */
  icon?: string;
}

export interface AuroraAccordionProps {
  /** Accordion rows. */
  items: AuroraAccordionItem[];
  /** Aurora glow colors blended inside the opened card. */
  auroraColors?: string[];
  /** How long the aurora bloom stays before settling, in ms. */
  bloomDuration?: number;
  class?: string;
}

/**
 * A contiguous group of rows. The opened row becomes its own single-row
 * segment (`open: true`) so it can detach into a separate card.
 */
export interface AuroraAccordionSegment {
  key: string;
  open: boolean;
  rows: { item: AuroraAccordionItem; index: number }[];
}

/**
 * A contiguous run of rows: either the single opened row (detached into its
 * own card) or a group of closed rows rendered together.
 */
export interface AuroraAccordionSegment {
  key: string;
  open: boolean;
  rows: { item: AuroraAccordionItem; index: number }[];
}
