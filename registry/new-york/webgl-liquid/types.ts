export interface WebGLLiquidProps {
  title?: string;
  subtitle?: string;
  description?: string;
  colorDeep?: string;
  colorMid?: string;
  colorHighlight?: string;
  speed?: number;
  flowStrength?: number;
  grain?: number;
  contrast?: number;
  opacity?: number;
  reveal?: boolean;
  delayMs?: number;
  revealDuration?: number;
  class?: string;
}

export type WebGLLiquidUniforms = Record<string, WebGLUniformLocation>;
