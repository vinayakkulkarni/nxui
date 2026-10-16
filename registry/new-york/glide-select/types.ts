export interface GlideSelectOption {
  value: string;
  label: string;
  tag?: string;
}

export type GlideSelectItem = string | GlideSelectOption;

export type GlideSelectSize = 'sm' | 'md' | 'lg';

export type GlideSelectPlacement = 'top' | 'bottom';

export type GlideSelectAlign = 'left' | 'right';

export type GlideSelectPhase = 'closed' | 'open' | 'closing';

export interface GlideSelectProps {
  options?: GlideSelectItem[];
  /** Controlled value (v-model). */
  modelValue?: string;
  defaultValue?: string;
  placeholder?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: GlideSelectSize;
  radius?: number;
  menuWidth?: number;
  placement?: GlideSelectPlacement;
  align?: GlideSelectAlign;
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  class?: string;
}

export interface GlideSelectSizePreset {
  chip: number;
  row: number;
  font: number;
}
