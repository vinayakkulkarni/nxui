export interface EvilEyeProps {
  /** Primary eye color in HEX format. */
  eyeColor?: string;
  /** Brightness / HDR intensity of the eye color. */
  intensity?: number;
  /** Size and darkness of the pupil slit. */
  pupilSize?: number;
  /** Width of the main iris ring. */
  irisWidth?: number;
  /** Strength of the outer eye glow. */
  glowIntensity?: number;
  /** Zoom level of the eye. Values above 1 zoom in, below 1 zoom out. */
  scale?: number;
  /** Scale of the fire/noise texture sampling. */
  noiseScale?: number;
  /** Intensity of pupil cursor tracking. 0 disables it. */
  pupilFollow?: number;
  /** Independent flame flicker animation speed. */
  flameSpeed?: number;
  /** Background color in HEX format. */
  backgroundColor?: string;
  /** Draws the eye as saturated ink over a light background. */
  lightMode?: boolean;
  class?: string;
}

export interface EvilEyeDemoParams {
  eyeColor: string;
  backgroundColor: string;
  intensity: number;
  pupilSize: number;
  irisWidth: number;
  glowIntensity: number;
  scale: number;
  noiseScale: number;
  pupilFollow: number;
  flameSpeed: number;
  lightMode: boolean;
}
