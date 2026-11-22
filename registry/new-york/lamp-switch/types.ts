export type LampSwitchTheme = 'light' | 'dark';

export interface LampSwitchProps {
  /** Switch the light on by itself once the lamp has landed. */
  autoOn?: boolean;
  theme?: LampSwitchTheme;
  /** The card's size in px at most; it shrinks to fit a narrow container. */
  size?: number;
  /** Accessible name of the switch. */
  label?: string;
  class?: string;
}

/** The switch knob's colours for one theme. */
export interface LampSwitchColours {
  fillOn: string;
  fillOff: string;
  iconOn: string;
  iconOff: string;
}

/** The elements the engine drives. */
export interface LampSwitchElements {
  root: HTMLElement;
  card: HTMLElement;
  rings: SVGGElement;
  ambient: HTMLElement;
  lamp: HTMLElement;
  beam: SVGSVGElement;
  halo: SVGEllipseElement;
  bulbOn: SVGCircleElement;
  bulbOff: SVGCircleElement;
  rim: SVGPathElement;
  rimOff: SVGPathElement;
  dim: SVGGElement;
  grab: HTMLElement;
  switch: HTMLButtonElement;
  trackLight: HTMLElement;
  labelOn: HTMLElement;
  labelOff: HTMLElement;
  tail: HTMLElement;
  knob: HTMLElement;
  face: HTMLElement;
  icon: SVGSVGElement;
}

/** Live settings the engine reads on every use, so changing them never rebuilds it. */
export interface LampSwitchEngineOptions {
  autoOn: () => boolean;
  reduced: () => boolean;
  theme: () => LampSwitchTheme;
  onToggle: (on: boolean) => void;
}

export interface LampSwitchEngine {
  /** Flip the light, as a press of the switch would. */
  toggle: () => void;
  /** Set the light on or off; does nothing if it already is. */
  setOn: (on: boolean) => void;
  isOn: () => boolean;
  /** Give the hanging lamp a push: swing in deg/s, stretch in px/s. */
  nudge: (swing: number, stretch?: number) => void;
  /** Repaint the switch after a theme change. */
  repaint: () => void;
  /** The card's current scale, so pointer deltas map to card units. */
  setScale: (scale: number) => void;
  switchDown: (event: PointerEvent) => void;
  switchMove: (event: PointerEvent) => void;
  switchUp: (event: PointerEvent) => void;
  switchCancel: (event: PointerEvent) => void;
  switchClick: () => void;
  lampDown: (event: PointerEvent) => void;
  lampMove: (event: PointerEvent) => void;
  lampUp: (event: PointerEvent) => void;
  destroy: () => void;
}

/** One frame of the hanging lamp: cord stretch (px) and swing (deg). */
export interface LampSwitchBody {
  y: number;
  vy: number;
  th: number;
  vth: number;
}

export interface LampSwitchKnobDrag {
  id: number;
  startX: number;
  base: number;
  x: number;
  moved: boolean;
  lastX: number;
  lastT: number;
  v: number;
}

export interface LampSwitchLampDrag {
  id: number;
  sx: number;
  sy: number;
  y0: number;
  th0: number;
  arm: number;
  pulled: boolean;
  lastT: number;
  lastY: number;
  lastTh: number;
  vy: number;
  vth: number;
}
