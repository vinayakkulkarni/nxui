/** One position on the dial. */
export interface OperatingModeOption {
  /** Value written to `v-model`. */
  value: string;
  /** Label printed next to the dial. */
  label: string;
  /** Upper-case title shown in the display panel. */
  title: string;
  /** One line shown under the title in the display panel. */
  description: string;
  /**
   * Position on the dial in degrees, clockwise from 12 o'clock.
   * Keep it between -135 and 135. Spread evenly when left out.
   */
  angle?: number;
}

/** Price tier for one hour of the day. */
export type RateTier = 'off' | 'mid' | 'peak';

/** A schedule tab with 24 hourly price tiers. */
export interface OperatingModeSchedule {
  value: string;
  label: string;
  /** 24 entries, one per hour, starting at midnight. */
  hours: RateTier[];
}

/** Price shown in the legend for each tier. */
export interface OperatingModePrices {
  off: string;
  mid: string;
  peak: string;
}

export interface OperatingModeDialProps {
  /** Selected mode value. Use `v-model`. */
  modelValue?: string;
  /** Dial positions. */
  modes?: OperatingModeOption[];
  title?: string;
  subtitle?: string;
  /** Text in the pill at the top right. Empty hides it. */
  badge?: string;
  /** Lucide icon name for the header chip. */
  icon?: string;
  /** Schedule tabs under the display. */
  schedules?: OperatingModeSchedule[];
  /** Selected schedule tab. Use `v-model:schedule`. */
  schedule?: string;
  prices?: OperatingModePrices;
  /** Colour of the lit mode dot and the display text. */
  accent?: string;
  /** Colour of the line under the peak window. */
  peakColor?: string;
  cancelLabel?: string;
  applyLabel?: string;
  class?: string;
}

/** Props of the knob part. */
export interface OperatingModeDialKnobProps {
  stops: OperatingModeStop[];
  index: number;
  accent: string;
  label: string;
}

/** A dial position with its resolved angle. */
export interface OperatingModeStop {
  option: OperatingModeOption;
  angle: number;
}
