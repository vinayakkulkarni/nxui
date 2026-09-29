export type ChaosNoise = 'hash' | 'trig';

/** Shader parameters for one button state. */
export interface ChaosState {
  speed: number;
  /** Line amplitude; lower values pull the lines tighter. */
  amplitude: number;
  pulseMin: number;
  pulseMax: number;
  /** Spread of the second line pass; higher is more chaotic. */
  chaos: number;
}

export interface ChaosUniforms {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  tap: WebGLUniformLocation | null;
  speed: WebGLUniformLocation | null;
  amplitude: WebGLUniformLocation | null;
  pulseMin: WebGLUniformLocation | null;
  pulseMax: WebGLUniformLocation | null;
  noiseType: WebGLUniformLocation | null;
}

export interface ChaosButtonProps {
  label?: string;
  noise?: ChaosNoise;
  resting?: Partial<ChaosState>;
  active?: Partial<ChaosState>;
  /** Seconds to ease into the active state on press. */
  activeDuration?: number;
  /** Seconds to ease back to rest on release. */
  restingDuration?: number;
  class?: string;
}
