import type { HTMLAttributes } from 'vue';

export type LensClockTheme = 'light' | 'dark';

export interface LensClockProps {
  /** IANA time zone such as "America/Los_Angeles". Omit to use the viewer's own zone. */
  timeZone?: string;
  /** Fixed moment to display. Omit to keep the clock live, read from the viewer's device clock. */
  time?: Date;
  /** Force a palette. Omit to follow the surrounding `dark` class. */
  theme?: LensClockTheme;
  class?: HTMLAttributes['class'];
}

export interface LensClockParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface LensClockTick {
  i: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Inset lume line inside an hour sleeve. */
  lx1: number;
  ly1: number;
  lx2: number;
  ly2: number;
  isHour: boolean;
}

export interface LensClockLabel {
  hour: number;
  x: number;
  y: number;
  transform: string;
}
