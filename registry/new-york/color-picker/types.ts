export interface ColorPickerProps {
  /** Two-way bound hex color (e.g. '#e8b64c'). */
  modelValue?: string;
  /** Diameter of the closed swatch button, in px. */
  size?: number;
  /** Number of saturated hue petals in the outer ring. */
  hueCount?: number;
  /** Open on hover instead of click. */
  openOnHover?: boolean;
  class?: string;
}
