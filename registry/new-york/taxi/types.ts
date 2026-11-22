export type TaxiTheme = 'light' | 'dark';

export interface TaxiProps {
  /** How wide the card is drawn, in px. It narrows further on a small screen. */
  width?: number;
  /** Plays the ride's cues (horn, door, engine and the rest) when `soundBase` points at them. */
  sound?: boolean;
  /** Folder holding the twelve cue files (`tap.wav`, `horn.wav`…). Empty means silent. */
  soundBase?: string;
  /** `light` is ink on a yellow cab; `dark` turns the card to night with the cab-yellow glyph and panel lit on it. */
  theme?: TaxiTheme;
  class?: string;
}

export type TaxiStateName =
  | 'idle'
  | 'searching'
  | 'enroute'
  | 'arrived'
  | 'riding'
  | 'done'
  | 'thanks';

export interface TaxiEmits {
  rate: [stars: number];
  state: [state: TaxiStateName];
}

export type TaxiGlyphName = 'person' | 'wave' | 'taxi' | 'check';
export type TaxiTone = 'ink' | 'cab';
export type TaxiPanelKind = 'wide' | 'compact';
export type TaxiAct = 'request' | 'cancel' | 'board' | null;

export interface TaxiShapeSource {
  d: string;
  fill: TaxiTone;
}

export interface TaxiShape extends TaxiShapeSource {
  /** The outline as a ring of evenly spaced points, x/y interleaved. */
  ring: Float32Array;
}

export interface TaxiRideState {
  status: string;
  lines: string[];
  glyph: TaxiGlyphName;
  label: string;
  size: number;
  caption: string;
  panel: TaxiPanelKind;
  act: TaxiAct;
  aria: string;
  hint: string;
  track?: boolean;
  stars?: boolean;
}

export interface TaxiPanelInset {
  left: string;
  right: string;
}

export type TaxiCue =
  | 'tap'
  | 'open'
  | 'cancel'
  | 'ping'
  | 'found'
  | 'tick'
  | 'horn'
  | 'door'
  | 'engine'
  | 'done'
  | 'star'
  | 'thanks';

export interface TaxiCueOptions {
  rate?: number;
  delay?: number;
  gain?: number;
}

export interface TaxiControls {
  stop: () => void;
}

export interface TaxiMorphOptions {
  duration?: number;
  ease?: 'easeInOut' | readonly [number, number, number, number];
}

export interface TaxiElements {
  card: HTMLElement;
  panel: HTMLElement;
  action: HTMLButtonElement;
  label: HTMLElement;
  caption: HTMLElement;
  status: HTMLElement;
  hint: HTMLElement;
  icon: SVGSVGElement;
  shapes: SVGPathElement[];
  pinRing: HTMLElement;
  lines: HTMLElement[];
  blobs: HTMLElement[];
  goo: HTMLElement;
  track: HTMLElement;
  trackFill: HTMLElement;
  trackCar: HTMLElement;
  starsBox: HTMLElement;
  stars: HTMLButtonElement[];
  starsCaption: HTMLElement;
}

export interface TaxiEngineOptions {
  gooId: string;
  soundBase: string;
  sound: boolean;
  reduce: boolean;
  onRate: (stars: number) => void;
  onState: (state: TaxiStateName) => void;
}

export interface TaxiEngine {
  /** Presses the action, exactly as a tap on it would. */
  tap: () => void;
  /** Rates the finished ride with 1–5 stars. */
  rate: (stars: number) => void;
  setMuted: (muted: boolean) => void;
  destroy: () => void;
}

export interface TaxiExposed {
  tap: () => void;
  rate: (stars: number) => void;
}
