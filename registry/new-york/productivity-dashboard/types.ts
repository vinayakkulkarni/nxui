export interface ProductivityBar {
  /** Axis label under the bar, e.g. `3p` or `T`. */
  label: string;
  /** Bar value from 0 to 100. The highest bar gets the tooltip. */
  value: number;
}

export interface ProductivityRange {
  /** Tab id, e.g. `today`. */
  value: string;
  /** Tab text, e.g. `Today`. */
  label: string;
  /** Big percentage in the Energy tile, e.g. `78`. */
  average: number;
  /** Caption above the percentage, e.g. `Average today`. */
  caption: string;
  /** Comparison under the percentage, e.g. `+6% vs yesterday`. */
  delta: string;
  /** Colours the comparison green (`up`) or orange (`down`). */
  trend: 'up' | 'down';
  /** Columns of the Energy chart. */
  bars: ProductivityBar[];
}

export interface ProductivitySleepStep {
  /** 0 = deep, 1 = light, 2 = REM, 3 = awake. */
  stage: 0 | 1 | 2 | 3;
  /** Length of the step in minutes. */
  minutes: number;
}

export interface ProductivityTick {
  /** Minutes after the start of the night. */
  at: number;
  /** Axis text, e.g. `01:30`. */
  label: string;
}

export interface ProductivityStat {
  label: string;
  value: string;
}

export interface ProductivitySleep {
  /** Headline, e.g. `7h 42m`. */
  duration: string;
  /** Line under the headline in the tile, e.g. `Score 86 · Restful`. */
  summary: string;
  /** Line under the headline in the expanded view, e.g. `23:40 — 07:22 · Score 86`. */
  period: string;
  /** Dot matrix columns, each 0 to 4 lit dots from the bottom. */
  columns: number[];
  /** Small stats in the expanded view, e.g. Deep / REM / Awake. */
  stats: ProductivityStat[];
  /** Hypnogram steps for the expanded view, in order. */
  steps: ProductivitySleepStep[];
  /** Time labels under the hypnogram. */
  ticks: ProductivityTick[];
  /** Insight line at the bottom of the expanded view. */
  insight: string;
}

export interface ProductivitySession {
  /** Session id, e.g. `deep-work`. */
  id: string;
  /** Menu text, e.g. `Deep work`. */
  label: string;
  /** Length in minutes. */
  minutes: number;
  /** Lucide icon name without the prefix, e.g. `timer`. */
  icon: string;
}

export interface ProductivitySound {
  title: string;
  subtitle: string;
}

export interface ProductivityDashboardProps {
  /** Person greeted in the header. */
  name?: string;
  /** Greeting before the name. */
  greeting?: string;
  /** Date line under the greeting. */
  date?: string;
  /** Avatar image. Initials show when empty. */
  avatar?: string;
  /** Tabs and Energy data, one entry per tab. */
  ranges?: ProductivityRange[];
  /** `v-model:range`. Active tab value. Defaults to the first range. */
  range?: string;
  sleep?: ProductivitySleep;
  /** Focus timer presets. The first one is the reset value. */
  sessions?: ProductivitySession[];
  sound?: ProductivitySound;
  /** `v-model:expanded`. Shows the full Sleep view over the grid. */
  expanded?: boolean;
  /** Shows the dot on the bell button. */
  unread?: boolean;
  class?: string;
}

export interface ProductivityRollProps {
  /** Whole number to show. */
  value: number;
  /** Turns the spring off. */
  instant?: boolean;
}

export interface ProductivityEnergyProps {
  range: ProductivityRange;
  instant?: boolean;
}

export interface ProductivitySleepTileProps {
  sleep: ProductivitySleep;
  hidden?: boolean;
  instant?: boolean;
}

export interface ProductivitySleepDetailProps {
  sleep: ProductivitySleep;
  instant?: boolean;
}

export interface ProductivityFocusProps {
  sessions: ProductivitySession[];
  /** Selected session id. */
  session: string;
  /** Seconds left. */
  remaining: number;
  running: boolean;
  menuOpen: boolean;
  instant?: boolean;
}

export interface ProductivitySoundsProps {
  sound: ProductivitySound;
  playing: boolean;
  instant?: boolean;
}

export interface ProductivityPanelRect {
  top: number;
  left: number;
  width: number;
  height: number;
}
