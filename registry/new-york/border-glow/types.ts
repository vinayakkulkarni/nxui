import type { HTMLAttributes } from 'vue';

export interface BorderGlowProps {
  /** How close the pointer must be to the edge for the glow to appear (0-100). */
  edgeSensitivity?: number;
  /** HSL values for the glow colour, as "H S L" (e.g. "40 80 80"). */
  glowColor?: string;
  /** Background colour of the card. Light colours switch to a light-surface border and shadow. */
  backgroundColor?: string;
  /** Corner radius of the card in px. */
  borderRadius?: number;
  /** How far the outer glow extends beyond the card in px. */
  glowRadius?: number;
  /** Multiplier for glow opacity (0.1-3.0). */
  glowIntensity?: number;
  /** Width of the directional cone mask as a percentage (5-45). */
  coneSpread?: number;
  /** Play an intro sweep animation on mount. */
  animated?: boolean;
  /** Three colours for the mesh-gradient border, distributed across seven positions. */
  colors?: string[];
  /** Opacity of the coloured fill near the edges. */
  fillOpacity?: number;
  class?: HTMLAttributes['class'];
}

export interface BorderGlowHsl {
  h: number;
  s: number;
  l: number;
}

export interface BorderGlowTween {
  start?: number;
  end?: number;
  /** Duration in ms. */
  duration?: number;
  /** Delay in ms. */
  delay?: number;
  ease?: (t: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}
