/**
 * Props for the SpectralRibbon registry component.
 */
export interface SpectralRibbonProps {
  /** Animation speed, 0 to 2. Zero freezes the current frame. */
  speed?: number;
  /** Ribbon brightness, 0.25 to 2. */
  intensity?: number;
  /** Ribbon thickness, 0.5 to 2. */
  thickness?: number;
  /** Film grain amount, 0 to 1. */
  grain?: number;
  /** Additional classes for the root container. */
  class?: string;
}

/**
 * Uniform locations used by the SpectralRibbon fragment shader.
 */
export interface SpectralRibbonUniforms {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  intensity: WebGLUniformLocation | null;
  thickness: WebGLUniformLocation | null;
  grain: WebGLUniformLocation | null;
}
