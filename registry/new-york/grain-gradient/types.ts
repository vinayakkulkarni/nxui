/**
 * Props for the GrainGradient registry component.
 */
export interface GrainGradientProps {
  /** Pale highlight color. Accepts three- or six-digit hex. */
  colorLight?: string;
  /** Upper-left wash and diffused edge color. Accepts three- or six-digit hex. */
  colorMid?: string;
  /** Deep shadow color. Accepts three- or six-digit hex. */
  colorDark?: string;
  /** Composition rotation in degrees, -360 to 360. */
  angle?: number;
  /** Horizontal edge offset, -1 to 1. */
  position?: number;
  /** Bend of the shadow edge, -1 to 1. */
  curve?: number;
  /** Width of the diffused edge, 0.01 to 1. */
  softness?: number;
  /** Composition zoom, 0.25 to 3. */
  scale?: number;
  /** Grain strength, 0 to 1. */
  grain?: number;
  /** Grain size in CSS pixels, 0.5 to 4. */
  grainSize?: number;
  /** Reproducible texture seed, 0 to 100000. */
  seed?: number;
  /** Breathing speed, 0 to 2. Zero pauses on the current frame. */
  speed?: number;
  /** Additional CSS classes for the container. */
  class?: string;
}

/** A named three-color palette for GrainGradient. */
export interface GrainGradientPalette {
  name: string;
  colorLight: string;
  colorMid: string;
  colorDark: string;
}
