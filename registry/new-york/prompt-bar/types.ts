export interface PromptBarSource {
  key: string;
  name: string;
  description?: string;
  /** Iconify name, e.g. `lucide:globe`. */
  icon?: string;
  /** The row that adds files: picking it calls `onAttach`. */
  attach?: boolean;
}

export interface PromptBarCommand {
  key: string;
  name: string;
  description?: string;
}

export interface PromptBarModel {
  key: string;
  name: string;
  tag?: string;
}

export interface PromptBarSendDetail {
  attachments: string[];
  model?: PromptBarModel;
  effort?: string;
}

export type PromptBarAttachResult = string | string[] | undefined;
export type PromptBarDictateResult = string | undefined;

export interface PromptBarProps {
  placeholder?: string;
  sources?: PromptBarSource[];
  commands?: PromptBarCommand[];
  models?: PromptBarModel[];
  defaultModel?: string;
  efforts?: string[];
  defaultEffort?: string;
  busy?: boolean;
  /** Picked the attach row. Return file names (or a promise of them) to show them as chips. */
  onAttach?: () => PromptBarAttachResult | Promise<PromptBarAttachResult>;
  /** The mic. Return the transcript (or a promise of it). Omit to hide the mic. */
  onDictate?: () => PromptBarDictateResult | Promise<PromptBarDictateResult>;
  background?: string;
  color?: string;
  menuBackground?: string;
  sparkColor?: string;
  sparkBoost?: number;
  width?: number;
  radius?: number;
  maxRows?: number;
  morphDuration?: number;
  squash?: number;
  tilt?: number;
  pressScale?: number;
  class?: string;
}

export interface PromptBarGlyphProps {
  busy: boolean;
  morphDuration: number;
  squash: number;
  tilt: number;
}

export type PromptBarMenuKind = 'at' | 'slash' | 'model' | 'effort';

export interface PromptBarToken {
  kind: 'at' | 'slash';
  query: string;
  start: number;
}

export interface PromptBarRow {
  key: string;
  name: string;
  description?: string;
  tag?: string;
  icon?: string;
  attach?: boolean;
}

export interface PromptBarSpark {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  life: number;
  span: number;
}
