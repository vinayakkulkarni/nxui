/** Which way the row is swiped to reveal its drawer. */
export type SwipeRowDirection = 'left' | 'right';

/** Lifecycle phase of a row: resting, sliding off, or folding shut. */
export type SwipeRowPhase = 'idle' | 'committing' | 'collapsing';

/** One button in the drawer. The first action is the full-swipe action. */
export interface SwipeAction {
  /** Stable key. */
  id: string;
  /** Visible label and the announced name. */
  label: string;
  /** Iconify name, e.g. `lucide:archive`. */
  icon?: string;
  /** Background of a secondary action. Defaults to `drawerColor`. */
  color?: string;
  /** Fold the row away when this secondary action is pressed. */
  dismiss?: boolean;
  /** Called when the action runs (after the fold for folding actions). */
  onSelect?: () => void;
}

/** Props for the SwipeRow registry component. */
export interface SwipeRowProps {
  /** The drawer, outermost first. The first one leaps on a full swipe and always folds the row. */
  actions?: SwipeAction[];
  /** The full-swipe block that leaps and fills the row. */
  actionColor?: string;
  /** The drawer base and the secondary actions. */
  drawerColor?: string;
  /** The surface. */
  rowColor?: string;
  /** Row text and the keyboard toggle. */
  textColor?: string;
  /** Row height in pixels. The fold closes from it. */
  height?: number;
  /** Corner radius of the row and the clipped drawer. */
  radius?: number;
  /** Width of each action in pixels. */
  actionWidth?: number;
  /** Which way you swipe. Everything mirrors. */
  direction?: SwipeRowDirection;
  /** Overshoot of the settle after a flick. Slow releases never bounce. */
  snapBounce?: number;
  /** How much of the finger the row keeps past the drawer. */
  resistance?: number;
  /** How long a deleted row takes to fold shut (ms). */
  collapseMs?: number;
  /** Fraction of the row width that must be uncovered for a release to commit. */
  commitAt?: number;
  /** Off, the drawer is the end: no leap, no commit. */
  fullSwipe?: boolean;
  /** Dims the row and ignores input. */
  disabled?: boolean;
  /** Controlled open state (`v-model:open`). Leave undefined for uncontrolled. */
  open?: boolean;
  /** Close the drawer after a non-folding action is pressed. */
  closeOnAction?: boolean;
  /** A short vibration on touch when the block leaps. */
  haptic?: boolean;
  /** Accessible name of the row. */
  label?: string;
  /** Extra classes on the root. */
  class?: string;
}

/** Internal pointer-gesture bookkeeping. */
export interface SwipeRowGrip {
  id: number;
  x0: number;
  y0: number;
  grab: number | null;
  moved: boolean;
  hist: Array<[number, number]>;
  touch: boolean;
}
