export interface GooeyDropdownItem {
  /** Item label. */
  label: string;
  /** Optional @nuxt/icon name (e.g. 'lucide:link'). */
  icon?: string;
}

export interface GooeyDropdownProps {
  /** Trigger label. */
  label?: string;
  /** Optional @nuxt/icon name for the trigger. */
  icon?: string;
  /** Menu items that stretch out of the trigger with a gooey merge. */
  items: GooeyDropdownItem[];
  /** Direction the items unfurl. */
  direction?: 'up' | 'down';
  /** Gap between merged blobs at rest, in px (smaller = more merge). */
  gap?: number;
  /** Spring stiffness for the unfurl. */
  stiffness?: number;
  /** Spring damping for the unfurl. */
  damping?: number;
  class?: string;
}
