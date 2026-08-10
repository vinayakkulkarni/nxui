import type * as THREE from 'three';

export interface DistortionUniforms {
  [key: string]: { value: THREE.Vector2 | THREE.Vector3 | THREE.Vector4 };
}

export interface DistortionPreset {
  uniforms: DistortionUniforms;
  getDistortion: string;
  getJS?: (progress: number, time: number) => THREE.Vector3;
}

export interface HyperspeedColors {
  roadColor?: number;
  islandColor?: number;
  background?: number;
  shoulderLines?: number;
  brokenLines?: number;
  leftCars?: number[];
  rightCars?: number[];
  sticks?: number | number[];
}

export interface HyperspeedOptions {
  onSpeedUp?: (ev: Event) => void;
  onSlowDown?: (ev: Event) => void;
  distortion?: string;
  length?: number;
  roadWidth?: number;
  islandWidth?: number;
  lanesPerRoad?: number;
  fov?: number;
  fovSpeedUp?: number;
  speedUp?: number;
  carLightsFade?: number;
  totalSideLightSticks?: number;
  lightPairsPerRoadWay?: number;
  shoulderLinesWidthPercentage?: number;
  brokenLinesWidthPercentage?: number;
  brokenLinesLengthPercentage?: number;
  lightStickWidth?: [number, number];
  lightStickHeight?: [number, number];
  movingAwaySpeed?: [number, number];
  movingCloserSpeed?: [number, number];
  carLightsLength?: [number, number];
  carLightsRadius?: [number, number];
  carWidthPercentage?: [number, number];
  carShiftX?: [number, number];
  carFloorSeparation?: [number, number];
  colors?: HyperspeedColors;
}
