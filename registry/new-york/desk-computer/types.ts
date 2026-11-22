export type DeskComputerTheme = 'light' | 'dark';

export interface DeskComputerProps {
  /** Colour theme of the figure. Pass your site's colour mode. */
  theme?: DeskComputerTheme;
  /** Key clicks and the CRT's power-on hum and power-off zap, synthesised. Only your own input makes sound. */
  sound?: boolean;
  /** Fill the container edge to edge; otherwise it keeps the drawing's own 1000:760 shape. */
  fill?: boolean;
  /** Where the drawing is served from. */
  src?: string;
  class?: string;
}

export type DeskComputerLoadState = 'loading' | 'ready' | 'failed';

/** What the engine hands back: replay the assembly, mute or unmute, and tear everything down. */
export interface DeskEngine {
  /** The system assembles itself again — the figure does this on every theme change. */
  replayIntro: () => void;
  setMuted: (muted: boolean) => void;
  /** Tell the engine whether the figure is on screen; it only animates while it is. */
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

export interface DeskMountOptions {
  /** The focusable element the figure sits in: it takes the keys and the pointer. */
  stage: HTMLElement;
  svg: SVGSVGElement;
  /** Where a running "on · 12 chars · key a" line is written, if you want one. */
  readout?: HTMLElement | null;
  /** A polite live region for what just happened. */
  status: HTMLElement;
  muted: boolean;
}

/* ---- engine geometry ---- */

export type DeskVec2 = [number, number];
export type DeskVec3 = [number, number, number];

export interface DeskProjection {
  origin: DeskVec2;
  scale: number;
  azimuth: number;
  elevation: number;
}

export interface DeskPlan {
  x: number;
  y: number;
  w: number;
  d: number;
  r: number;
}

export interface DeskPaths {
  fill: string;
  outline: string;
  crease: string;
  top: string;
  shades: string[];
  bevel?: string;
}

export interface DeskRect {
  u0: number;
  u1: number;
  z0: number;
  z1: number;
}

/** The figure's own geometry, exported alongside its SVG. */
export interface DeskData {
  P: DeskProjection;
  keys: string[];
  crtMid: number;
  queryX: number;
  queryMax: number;
  scale: number;
  screen: DeskRect;
  search: DeskRect;
  cursor: { u: number; z: number };
  mouse: {
    centre: DeskVec2;
    tip: DeskVec3;
    dir: DeskVec3;
    padTop: number;
    edge: DeskVec3;
    padY: DeskVec2;
    anchor: DeskVec3;
    tangent: DeskVec3;
    r: number;
    range: { x: DeskVec2; y: DeskVec2 };
  };
  tray: {
    front: number;
    y0: number;
    y1: number;
    body: { y0: number; y1: number; z: number; h: number };
    plate: { z0: number; z1: number; t: number };
    travel: number;
    bay: DeskRect;
  };
  disc: { r: number; home: DeskVec3 };
}

/* ---- engine sound ---- */

export interface DeskToneOptions {
  type?: OscillatorType;
  f0?: number;
  f1?: number;
  gain?: number;
  attack?: number;
  filter?: number;
}

export interface DeskNoiseOptions {
  type?: BiquadFilterType;
  freq?: number;
  q?: number;
  gain?: number;
  attack?: number;
}

export interface DeskSound {
  unlock: () => void;
  setMuted: (next: boolean) => void;
  key: (code: string) => void;
  powerOn: () => void;
  powerOff: () => void;
  close: () => void;
}

/* ---- engine state ---- */

export type DeskTourStep =
  | 'aim'
  | 'click'
  | 'type'
  | 'enter'
  | 'drift'
  | 'cd'
  | 'eject'
  | 'off'
  | 'on';

export interface DeskTour {
  phrase: number;
  step: DeskTourStep;
  index: number;
  wait: number;
}

export interface DeskKeyState {
  at: number;
  held: number;
}

export interface DeskWaiter {
  test: () => boolean;
  done: () => void;
}

export interface DeskMouseState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  tau: number;
  press: number;
  dragging: boolean;
  drawn: string;
}

export interface DeskFlight {
  t: number;
  toDrive: boolean;
}

export interface DeskCdState {
  at: 'case' | 'drive';
  tray: number;
  trayTo: number;
  flight: DeskFlight | null;
  spin: number;
  busy: boolean;
  read: number;
  autoplay: number;
  autoplayTo: number;
  autoplayTimer: number;
  drawnTray: number;
}

export interface DeskDrag {
  id: number;
  sx: number;
  sy: number;
  mx: number;
  my: number;
  moved: number;
}
