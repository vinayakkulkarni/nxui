export type FlyingButtonSize = 'small' | 'medium' | 'large' | 'extra-large';

export type FlyingButtonTheme = 'dark' | 'light';

export type FlyingButtonTrigger = 'hover' | 'click';

export type FlyingButtonClickHandler = (
  event: MouseEvent | PointerEvent,
) => void;

export interface FlyingButtonProps {
  label?: string;
  theme?: FlyingButtonTheme;
  size?: FlyingButtonSize;
  radius?: number;
  altitude?: number;
  hoverTime?: number;
  jets?: number;
  thrusters?: boolean;
  trigger?: FlyingButtonTrigger;
  carryCursor?: boolean;
  ramp?: boolean;
  smoke?: number;
  turbulence?: number;
  wobble?: number;
  thrustColor?: string;
  smokeColor?: string;
  buttonColor?: string;
  textColor?: string;
  rampColor?: string;
  class?: string;
}

export interface FlyingButtonSizeSpec {
  h: number;
  px: number;
  fs: number;
  k: number;
}

export type FlyingButtonPhase =
  | 'rest'
  | 'ignite'
  | 'climb'
  | 'hover'
  | 'descend'
  | 'landed'
  | 'drag'
  | 'drive'
  | 'loop'
  | 'flip'
  | 'return';

export interface FlyingButtonEngineProps {
  size: FlyingButtonSize;
  altitude: number;
  hoverTime: number;
  jets: number;
  thrusters: boolean;
  trigger: FlyingButtonTrigger;
  carryCursor: boolean;
  ramp: boolean;
  smoke: number;
  turbulence: number;
  wobble: number;
  thrustColor: string;
  smokeColor: string;
  theme: FlyingButtonTheme;
  reducedMotion: boolean;
  onClick: FlyingButtonClickHandler;
}

export interface FlyingButtonPropsRef {
  current: FlyingButtonEngineProps;
}

export interface FlyingButtonEngineArgs {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
  cursor: SVGSVGElement | null;
  ramp: SVGSVGElement | null;
  props: FlyingButtonPropsRef;
}

export interface FlyingButtonEngine {
  refresh: () => void;
  rehome: () => void;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

export interface FlyingButtonRampGeo {
  ss: number[];
  xs: number[];
  ys: number[];
  ps: number[];
  ks: number[];
  r: number;
  T: number;
  x0: number;
  foot: number;
  S: number;
  clear: number;
  ok: boolean;
}

export interface FlyingButtonTrack {
  geo: FlyingButtonRampGeo;
  base: number;
  v0: number;
  acc: number;
}

export interface FlyingButtonBack {
  from: number;
  to: number;
  time: number;
}

export interface FlyingButtonTurn {
  th: number;
  w: number;
}

export interface FlyingButtonPiece {
  el: HTMLElement;
  x: number;
  y: number;
  k: number;
}

export interface FlyingButtonStrip {
  wrap: HTMLDivElement;
  ink: HTMLDivElement;
  parts: HTMLElement[];
  n: number;
  sn: number[];
  pods: FlyingButtonPiece[];
  items: FlyingButtonPiece[];
}

export interface FlyingButtonNozzle {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface FlyingButtonPoint {
  x: number;
  y: number;
}

export interface FlyingButtonGrab {
  gx: number;
  gy: number;
}

export interface FlyingButtonPointer {
  in: boolean;
  x: number;
  y: number;
  type: string;
}

export interface FlyingButtonState {
  W: number;
  H: number;
  dpr: number;
  bw: number;
  bh: number;
  x: number;
  vx: number;
  y: number;
  vy: number;
  th: number;
  w: number;
  fvx: number;
  fvy: number;
  thrust: number[];
  delay: number[];
  phase: FlyingButtonPhase;
  pt: number;
  clock: number;
  seed: number;
  wind: number;
  alt: number;
  climbT: number;
  y0: number;
  vrPrev: number;
  hold: number;
  xRef: number;
  landX: number;
  boost: boolean;
  contact: boolean;
  placed: boolean;
  track: FlyingButtonTrack | null;
  back: FlyingButtonBack | null;
  flip: FlyingButtonTurn | null;
  rampKey: string;
  rampGeo: FlyingButtonRampGeo | null;
  strip: FlyingButtonStrip | null;
  u: number;
  v: number;
  target: FlyingButtonPoint;
  pointer: FlyingButtonPointer;
  off: FlyingButtonPoint;
  attached: boolean;
  hover: boolean;
  armed: boolean;
  carry: boolean;
  pressed: boolean;
  press: FlyingButtonPoint | null;
  drag: FlyingButtonGrab | null;
  suppress: boolean;
  lastC: FlyingButtonPoint | null;
  lastTh: number;
  quiet: number;
  running: boolean;
  visible: boolean;
  last: number;
  raf: number;
  simTime: number;
  activity: number;
}

export interface FlyingButtonTarget {
  tex: WebGLTexture | null;
  fbo: WebGLFramebuffer | null;
  w: number;
  h: number;
  mips: boolean;
}

export interface FlyingButtonPair {
  read: FlyingButtonTarget;
  write: FlyingButtonTarget;
  swap: () => void;
}

export interface FlyingButtonFields {
  vw: number;
  vh: number;
  dw: number;
  dh: number;
  velocity: FlyingButtonPair;
  pressure: FlyingButtonPair;
  divergence: FlyingButtonTarget;
  curl: FlyingButtonTarget;
  dye: FlyingButtonPair;
  soft: FlyingButtonTarget;
  temp: FlyingButtonTarget;
}

export interface FlyingButtonProgram {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

export interface FlyingButtonFloatList {
  f1: number[];
}

export type FlyingButtonUniform =
  | number
  | number[]
  | Float32Array
  | FlyingButtonTarget
  | FlyingButtonFloatList;

export interface FlyingButtonJets {
  a: Float32Array;
  b: Float32Array;
  bend: number[];
}

export interface FlyingButtonSimShared {
  jets: FlyingButtonJets;
  craft: number[];
  motion: number[];
  scale: number;
  activity: number;
  time: number;
}

export interface FlyingButtonStepInput extends FlyingButtonSimShared {
  jetX: number[];
  jetN: number;
  spacing: number;
  calm: number;
  wind: number;
  smoke: number;
  turbulence: number;
}

export interface FlyingButtonRenderInput extends FlyingButtonSimShared {
  light: boolean;
  smokeColor: number[];
  shadeColor: number[];
  thrustColor: number[];
}

export interface FlyingButtonSim {
  step: (dt: number, o: FlyingButtonStepInput) => void;
  render: (cw: number, ch: number, o: FlyingButtonRenderInput) => void;
  resize: (W: number, H: number) => void;
  clear: () => void;
  dispose: () => void;
}
