export interface CurvedDrawerProps {
  /** Which edge the drawer slides from. */
  side?: 'left' | 'right';
  /** Drawer panel width in px. */
  width?: number;
  /** Maximum bulge depth of the curved edge in px. */
  maxBulge?: number;
  /** Spring stiffness for the slide. */
  stiffness?: number;
  /** Spring damping for the slide. */
  damping?: number;
  /** Show a dimming overlay behind the drawer. */
  overlay?: boolean;
  /** Panel background color (any CSS color). */
  background?: string;
  class?: string;
}
