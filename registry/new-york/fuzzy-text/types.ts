export type FuzzyTextDirection = 'horizontal' | 'vertical' | 'both';

export type FuzzyTextTrigger = 'hover' | 'always' | 'click';

export interface FuzzyTextProps {
  /** The text to draw. */
  text: string;
  /** Any CSS size, or a number in px. Responsive sizes redraw on resize. */
  fontSize?: number | string;
  fontWeight?: number | string;
  /** `'inherit'` uses the font of the surrounding text. */
  fontFamily?: string;
  /** Follows the surrounding text color by default, including theme switches. */
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: FuzzyTextDirection;
  /** Frames the fuzz takes to ease between intensities. 0 switches instantly. */
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  sliceSize?: number;
  trigger?: FuzzyTextTrigger;
  intro?: boolean;
  introDuration?: number;
  /** 0–1. Splits the text into offset RGB (or CMY on dark ink) copies. */
  colorSplit?: number;
  class?: string;
}

/** Values the render loop reads every frame (no rebuild needed). */
export interface FuzzyTextTuning {
  enableHover: boolean;
  baseIntensity: number;
  hoverIntensity: number;
  fps: number;
  transitionDuration: number;
  clickEffect: boolean;
  sliceSize: number;
  trigger: FuzzyTextTrigger;
  intro: boolean;
  introDuration: number;
  colorSplit: number;
}

/** Values that change the painted source and force a rebuild. */
export interface FuzzyTextLayout {
  text: string;
  fontSize: number | string;
  fontWeight: number | string;
  fontFamily: string;
  color: string;
  gradient: string[] | null;
  letterSpacing: number;
  fuzzRange: number;
  direction: FuzzyTextDirection;
}

export interface FuzzyTextShared {
  getTuning: () => FuzzyTextTuning;
  isGlitching: () => boolean;
  reduceMotion: boolean;
  intro: { start: number; done: boolean };
}

export interface FuzzyTextEngine {
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  click: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

export type FuzzyTextPresetName = 'static' | 'glitch' | 'shiver' | 'melt';

/** Look settings the demo presets switch between. */
export interface FuzzyTextLook {
  colorSplit: number;
  trigger: FuzzyTextTrigger;
  direction: FuzzyTextDirection;
  baseIntensity: number;
  hoverIntensity: number;
  fuzzRange: number;
  sliceSize: number;
  fps: number;
  transitionDuration: number;
  intro: boolean;
  introDuration: number;
  clickEffect: boolean;
  glitchMode: boolean;
  glitchInterval: number;
  glitchDuration: number;
  letterSpacing: number;
}
