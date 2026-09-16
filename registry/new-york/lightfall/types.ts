export type Vec3 = [number, number, number];

export interface Uniforms {
  iResolution: { value: Vec3 };
  iMouse: { value: number[] };
  iTime: { value: number };
  uColor0: { value: Vec3 };
  uColor1: { value: Vec3 };
  uColor2: { value: Vec3 };
  uColor3: { value: Vec3 };
  uColor4: { value: Vec3 };
  uColor5: { value: Vec3 };
  uColor6: { value: Vec3 };
  uColor7: { value: Vec3 };
  uColorCount: { value: number };
  uBgColor: { value: Vec3 };
  uMouseColor: { value: Vec3 };
  uSpeed: { value: number };
  uStreakCount: { value: number };
  uStreakWidth: { value: number };
  uStreakLength: { value: number };
  uGlow: { value: number };
  uDensity: { value: number };
  uTwinkle: { value: number };
  uZoom: { value: number };
  uBgGlow: { value: number };
  uOpacity: { value: number };
  uMouseEnabled: { value: number };
  uMouseStrength: { value: number };
  uMouseRadius: { value: number };
}
