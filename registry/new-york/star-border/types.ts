import type { Component } from 'vue';

export type StarBorderTheme = 'dark' | 'light';
export type StarBorderDirection = 'clockwise' | 'counterclockwise';
export type StarBorderHover = 'lap' | 'brighten' | 'reveal' | 'none';

export interface StarBorderProps {
  /** Element or component to render, for example `a`, `div` or `NuxtLink`. */
  as?: string | Component;
  /** Color of the star and its glow. Defaults to white on dark and ink on light. */
  color?: string;
  /** Color the trail fades into behind the star. Defaults to `color`. */
  trailColor?: string;
  /** Seconds for one lap around the border. */
  duration?: number;
  /** Border width in pixels. */
  thickness?: number;
  /** Corner radius in pixels. Values past half the height give a pill. */
  radius?: number;
  /** Trail length as a share of the border (0–1). */
  trailLength?: number;
  /** Stars spaced evenly around the border, up to 6. */
  stars?: number;
  /** Bloom around the star and its trail, 0–1. */
  glow?: number;
  /** Twinkling glint at the head plus shed stardust. */
  sparkle?: boolean;
  direction?: StarBorderDirection;
  /** What happens on hover and keyboard focus. */
  hover?: StarBorderHover;
  /** Light races around the border from the point you press. */
  clickPulse?: boolean;
  theme?: StarBorderTheme;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  class?: string;
}

export interface StarBorderPalette {
  surface: string;
  text: string;
  track: string;
  light: string;
}

export type StarBorderRgb = [number, number, number];

export interface StarBorderSegment {
  length: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  angle: number | null;
}

export interface StarBorderShape {
  r: number;
  segments: StarBorderSegment[];
  total: number;
}

export interface StarBorderPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export interface StarBorderSettings {
  light: boolean;
  color: string;
  trailColor: string;
  duration: number;
  thickness: number;
  radius: number;
  trailLength: number;
  stars: number;
  glow: number;
  sparkle: boolean;
  direction: number;
  hover: StarBorderHover;
  clickPulse: boolean;
}

export interface StarBorderMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  seed: number;
}

export interface StarBorderPulse {
  origin: number;
  age: number;
}
