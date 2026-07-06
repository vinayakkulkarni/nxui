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
