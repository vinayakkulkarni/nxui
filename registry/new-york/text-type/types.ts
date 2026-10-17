export type TextTypeDeleteMode = 'backspace' | 'select';

export type TextTypeCursorStyle = 'character' | 'bar' | 'block' | 'underscore';

export type TextTypeEffect = 'none' | 'fade' | 'blur' | 'rise';

export interface TextTypeVariableSpeed {
  min: number;
  max: number;
}

export interface TextTypeTypo {
  /** Wrong characters that will be typed before the mistake is noticed. */
  plan: string[];
  /** Wrong characters currently on screen. */
  tail: string[];
  /** True while the typo is being erased. */
  fixing: boolean;
}

export interface TextTypeEffectDefinition {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export interface TextTypeProps {
  /** A sentence, or a list of sentences typed one after another. */
  text: string | string[];
  /** Element rendered as the root, such as `h1` or `span`. */
  as?: string;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  deleteMode?: TextTypeDeleteMode;
  loop?: boolean;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorStyle?: TextTypeCursorStyle;
  cursorCharacter?: string;
  cursorColor?: string;
  cursorClass?: string;
  cursorBlinkDuration?: number;
  cursorGlide?: boolean;
  typeEffect?: TextTypeEffect;
  /** 0–1: how often a wrong key is hit and then corrected. */
  mistakes?: number;
  prefix?: string;
  prefixColor?: string;
  textColors?: string[];
  variableSpeed?: TextTypeVariableSpeed;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  class?: string;
}
