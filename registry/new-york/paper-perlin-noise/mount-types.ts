/**
 * Uniform values accepted by PaperShaderMount. String values are treated as
 * image URLs and loaded into HTMLImageElement before being passed to the
 * underlying ShaderMount (mirrors @paper-design/shaders-react behavior).
 */
export type PaperShaderUniformValue =
  | string
  | boolean
  | number
  | number[]
  | number[][]
  | HTMLImageElement
  | undefined;

export type PaperShaderUniforms = Record<string, PaperShaderUniformValue>;

export interface PaperShaderMountProps {
  /** Fragment shader source from @paper-design/shaders. */
  fragmentShader: string;
  /** Shader uniforms. String values are loaded as image URLs. */
  uniforms: PaperShaderUniforms;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** Minimum device pixel ratio used for rendering. */
  minPixelRatio?: number;
  /** Maximum rendered pixel count (caps resolution on large screens). */
  maxPixelCount?: number;
  /** Uniform names that should get mipmapped textures (image filters). */
  mipmaps?: string[];
  /** Additional CSS classes for the host element. */
  class?: string;
}
