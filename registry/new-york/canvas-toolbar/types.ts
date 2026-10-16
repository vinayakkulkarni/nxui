export interface CanvasTool {
  /** Value written to `v-model` when the tool is active. */
  id: string;
  label: string;
  /** Iconify name, e.g. `lucide:navigation`. */
  icon: string;
  /** Single key that picks the tool. Defaults to its position (1, 2, 3…). */
  shortcut?: string;
}

export interface CanvasToolbarProps {
  tools?: CanvasTool[];
  /** Listens for the tool shortcut keys on the window. Ignored while typing. */
  shortcuts?: boolean;
  /** Accessible name for the radio group. */
  label?: string;
  class?: string;
}

export interface CanvasViewOption {
  id: string;
  label: string;
  icon: string;
}

export interface CanvasMenuAction {
  id: string;
  label: string;
  icon: string;
  /** Hint shown on the right of the item, e.g. `⌘D`. */
  shortcut?: string;
  /** Paints the item in the destructive color. */
  destructive?: boolean;
}

export interface CanvasSelectionToolbarProps {
  /** Ways to show the selected node. Bind the current one with `v-model:view`. */
  views?: CanvasViewOption[];
  /** Items in the "more" menu. Picking one emits `action`. */
  actions?: CanvasMenuAction[];
  expandLabel?: string;
  moreLabel?: string;
  /** Accessible name for the toolbar. */
  label?: string;
  class?: string;
}

export type CanvasSelectionMenu = 'view' | 'more';

export type CanvasToolbarMenuMode = 'radio' | 'action';

export interface CanvasToolbarMenuProps {
  items: CanvasMenuAction[];
  /** `radio` renders `menuitemradio` rows with a check on `checked`. */
  mode?: CanvasToolbarMenuMode;
  checked?: string;
  label: string;
  align?: 'start' | 'end';
  class?: string;
}
