export type RibbonsShape = 'lens' | 'comet' | 'even';

export interface RibbonsProps {
  /** One ribbon per color, drawn back to front. Up to 12. */
  colors?: string[];
  shape?: RibbonsShape;
  thickness?: number;
  length?: number;
  spread?: number;
  stiffness?: number;
  bounce?: number;
  wave?: number;
  softness?: number;
  fade?: boolean;
  opacity?: number;
  backgroundColor?: string;
  /** Device pixel ratio override. Defaults to the screen ratio capped at 2. */
  dpr?: number;
  class?: string;
}

export type RibbonsRgba = [number, number, number, number];

export interface RibbonsSettings {
  colors: RibbonsRgba[];
  back: RibbonsRgba;
  thickness: number;
  length: number;
  spread: number;
  stiffness: number;
  bounce: number;
  shape: number;
  wave: number;
  softness: number;
  fade: boolean;
  opacity: number;
  dpr: number | undefined;
}

export interface RibbonState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  points: Float32Array;
  pull: number;
  drag: number;
  width: number;
  lift: number;
  nudge: number;
  phase: number;
}

export interface RibbonsRenderer {
  redraw: () => void;
  pointer: (clientX: number, clientY: number) => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}
