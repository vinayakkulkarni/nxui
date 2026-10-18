export type CodeSlotsStatus = 'idle' | 'error' | 'success';

export interface CodeSlotsProps {
  /** Number of slots. */
  length?: number;
  /** Controlled code (v-model). Leave undefined for an uncontrolled field. */
  modelValue?: string;
  /** Uncontrolled initial code, rendered already landed. */
  defaultValue?: string;
  status?: CodeSlotsStatus;
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  bounce?: number;
  settle?: number;
  rise?: number;
  cascade?: number;
  ariaLabel?: string;
  class?: string;
}
