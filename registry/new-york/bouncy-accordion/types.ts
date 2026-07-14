/**
 * A single accordion row.
 */
export interface BouncyAccordionItem {
  /** Unique identity used for `v-model` matching. */
  id: string;
  /** Row title shown in the trigger. */
  title: string;
  /** Optional body text revealed on expand. */
  description?: string;
  /** Optional Iconify icon name rendered before the title. */
  icon?: string;
  /** Disables the row entirely. */
  disabled?: boolean;
}

/**
 * Props for the BouncyAccordion registry component.
 */
export interface BouncyAccordionProps {
  /** Accordion rows. */
  items: BouncyAccordionItem[];
  /** Allow closing the open row by clicking it again. */
  collapsible?: boolean;
  /** Additional classes on the root element. */
  class?: string;
}
