/** Block types the palette knows how to draw an icon and a preview for. */
export type BlockPaletteKind =
  | 'group'
  | 'chart'
  | 'slice'
  | 'parameter'
  | 'markdown';

export interface BlockPaletteItem {
  /** Unique id. Used as the list key and for reordering. */
  id: string;
  kind: BlockPaletteKind;
  title: string;
  /** Muted second line, e.g. `bar · line · area`. */
  subtitle: string;
  /** Overrides the icon for the kind, e.g. `lucide:table`. */
  icon?: string;
}

export interface BlockPaletteKindStyle {
  icon: string;
  /** Color classes for the icon tile. */
  tone: string;
}

/** Payload of the `drag-end` event. */
export interface BlockPaletteDragEnd {
  block: BlockPaletteItem;
  /** True when the block was dropped back on the list (and reordered). */
  inside: boolean;
  /** Pointer position in viewport pixels at the drop. */
  x: number;
  y: number;
}

export interface BlockPaletteProps {
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  /**
   * Key that focuses the search field while no field has focus. Pass an empty
   * string to turn it off.
   */
  shortcut?: string;
  emptyText?: string;
  /** Accessible label for the add button. */
  addLabel?: string;
  class?: string;
}

/** Where the lifted card is drawn, in viewport pixels. */
export interface BlockPaletteGhost {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A pointer press on a row that may turn into a drag. */
export interface BlockPalettePress {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  lastX: number;
}

export interface BlockPalettePreviewProps {
  kind: BlockPaletteKind;
}
