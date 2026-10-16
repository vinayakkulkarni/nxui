export interface SloshGaugeProps {
  /** The level, 0 to 100, controlled (v-model). Every change launches the liquid toward it. */
  modelValue?: number;
  /** The starting level when uncontrolled. */
  defaultValue?: number;
  /** Press or drag the tank to set the level, arrows to step. */
  interactive?: boolean;
  /** A readout whose colour flips at the surface. */
  showValue?: boolean;
  /** Dimmed and inert. Value changes still animate. */
  disabled?: boolean;
  /** The liquid. The readout over it picks dark or light by itself. */
  liquidColor?: string;
  /** The tank. */
  glassColor?: string;
  /** Tank width in px. The readout scales with it. */
  width?: number;
  /** Tank height in px. */
  height?: number;
  /** Corner radius in px, capped at half the smaller side. */
  radius?: number;
  /** Lines etched on the right of the glass. 0 hides them. */
  ticks?: number;
  /** 0 is a rigid gauge. Higher is slower, longer to settle, and overshoots more. */
  viscosity?: number;
  /** How far the surface leans per unit of speed. 0 keeps it flat. */
  tilt?: number;
  /** How much of a slam the top and bottom give back. */
  splash?: number;
  /** Readout suffix. */
  unit?: string;
  /** Accessible name of the meter or slider. */
  ariaLabel?: string;
  class?: string;
}

export interface SloshGaugeSim {
  x: number;
  v: number;
  L: number;
  raf: number;
  last: number;
}

export interface SloshGaugeGrip {
  id: number;
  rect: DOMRect;
  scale: number;
  band: boolean;
  grab: number | null;
  at: number;
  sent: number;
}

export interface SloshGaugePreset {
  label: string;
  value: number;
}
