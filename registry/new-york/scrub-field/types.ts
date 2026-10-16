export type ScrubFieldSize = 'sm' | 'md' | 'lg';

export interface ScrubFieldProps {
  label?: string;
  suffix?: string;
  /** Controlled value (v-model). */
  modelValue?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: ScrubFieldSize;
  sensitivity?: number;
  rubberReach?: number;
  returnDuration?: number;
  coarseMultiplier?: number;
  fineMultiplier?: number;
  showDelta?: boolean;
  showDirty?: boolean;
  showFill?: boolean;
  accent?: string;
  chipColor?: string;
  disabled?: boolean;
  class?: string;
}

export interface ScrubFieldDrag {
  id: number;
  x: number;
  raw: number;
  mult: number;
  moved: boolean;
  before: number;
  slack: number;
  left: number;
}

export interface ScrubFieldModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

export interface ScrubFieldSizePreset {
  height: number;
  font: number;
  radius: number;
  width: number;
}
