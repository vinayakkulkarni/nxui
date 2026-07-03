export interface DragReorderListProps {
  /** Items to render. Reordered array is emitted via update:modelValue. */
  modelValue: string[];
  /** Fixed row height in px (uniform rows keep drop math exact). */
  itemHeight?: number;
  /** Vertical gap between rows in px. */
  gap?: number;
  /** Show the grip handle indicator. When false, the whole row drags. */
  showHandle?: boolean;
  /** Scale applied to the lifted row. */
  liftScale?: number;
  /** Max tilt (deg) applied from drag velocity. */
  maxTilt?: number;
  /** Spring stiffness for settle/shift animations. */
  stiffness?: number;
  /** Spring damping for settle/shift animations. */
  damping?: number;
  class?: string;
}
