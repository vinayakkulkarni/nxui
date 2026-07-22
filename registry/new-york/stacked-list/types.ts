export interface StackedListItem {
  /** Small muted line above the title (e.g. a date). */
  eyebrow?: string;
  /** Primary label for the row. */
  title: string;
  /** Optional thumbnail image URL rendered as a rounded square. */
  image?: string;
}

export interface StackedListProps {
  /** Rows to render. Collapsed into a deck, fanned out on hover. */
  items: StackedListItem[];
  /** Fixed row height in px. */
  itemHeight?: number;
  /** Vertical gap between rows when expanded, in px. */
  gap?: number;
  /** Sliver (px) each stacked card peeks below the one in front when collapsed. */
  peek?: number;
  /** Expand on pointer hover. When false, expansion is click-only. */
  expandOnHover?: boolean;
  /** Spring stiffness for the collapse/expand motion. */
  stiffness?: number;
  /** Spring damping for the collapse/expand motion. */
  damping?: number;
  class?: string;
}
