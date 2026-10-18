import type { StyleValue } from 'vue';

export type CounterDirection = 'auto' | 'up' | 'down' | 'shortest';

export interface CounterProps {
  value?: number;
  locale?: string | string[];
  format?: Intl.NumberFormatOptions;
  decimals?: number;
  minDigits?: number;
  prefix?: string;
  suffix?: string;
  direction?: CounterDirection;
  duration?: number;
  bounce?: number;
  stagger?: number;
  motionBlur?: boolean;
  intro?: boolean;
  fade?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  textColor?: string;
  gap?: number;
  padding?: number;
  tabular?: boolean;
  digitStyle?: StyleValue;
  class?: string;
}

export type CounterSlotKind = 'digit' | 'symbol';

export interface CounterSlot {
  key: string;
  kind: CounterSlotKind;
  digit: number;
  text: string;
  rank: number;
}

export interface CounterListSlot extends CounterSlot {
  start: number;
}

export interface CounterItem {
  kind: CounterSlotKind;
  rank: number;
  pos: number;
  vel: number;
  target: number;
  shown: number;
  shownVel: number;
  shownTarget: number;
  wait: number;
  exiting: boolean;
  natural: number;
  el: HTMLElement | null;
  numerals: HTMLElement[] | null;
  strip: HTMLElement | null;
  blur: SVGFEGaussianBlurElement | null;
  filter: string;
  blurred: boolean;
}

export interface CounterSettings {
  direction: CounterDirection;
  duration: number;
  bounce: number;
  stagger: number;
  motionBlur: boolean;
  tabular: boolean;
}

export type CounterDemoScene = 'countdown' | 'pricing' | 'dashboard' | 'basic';

export type CounterDemoFormat = 'number' | 'currency' | 'compact' | 'unit';

export interface CounterMotionProps {
  direction: CounterDirection;
  duration: number;
  bounce: number;
  stagger: number;
  fade: number;
  motionBlur: boolean;
  intro: boolean;
}

export interface CounterDashboardStats {
  revenue: number;
  active: number;
  orders: number;
  conversion: number;
}
