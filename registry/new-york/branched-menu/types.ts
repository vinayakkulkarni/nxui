import type { HTMLAttributes } from 'vue';

export interface BranchedMenuChild {
  value: string;
  label: string;
  /** Iconify name, e.g. `lucide:rocket`. */
  icon?: string;
}

export interface BranchedMenuItem {
  label: string;
  /** Value of a leaf section. Defaults to its label. */
  value?: string;
  /** A section with children folds; one without is a leaf that selects. */
  children?: BranchedMenuChild[];
}

export interface BranchedMenuProps {
  /** Sections: a label plus children, or a leaf with a value. */
  items?: BranchedMenuItem[];
  /** The section, or sections, open at first. -1 for none. */
  defaultOpen?: number | number[];
  /** Value selected at first. Empty picks the open section's first child. */
  defaultActive?: string;
  /** The ink. Idle text is a mix of it. */
  color?: string;
  /** The active line, the active label and the marker. */
  accentColor?: string;
  /** The rail, trunk and branches. */
  lineColor?: string;
  /** The widest the menu may be, in px. It shrinks to its content. */
  width?: number;
  /** Height of a child row in px. */
  rowHeight?: number;
  /** Where child rows start, in px. Branches end just before it. */
  indent?: number;
  /** The trunk line's x position, in px. */
  trunk?: number;
  /** The curve of each branch, in px. */
  radius?: number;
  /** Stroke width of the lines. */
  lineWidth?: number;
  /** Child text size in px. Headers are 1px larger. */
  fontSize?: number;
  /** The accent line's travel, in ms. */
  drawDuration?: number;
  /** A section's fold and unfold, in ms. */
  foldDuration?: number;
  class?: HTMLAttributes['class'];
}
