import type { Group, Scene, Vector3, WebGLRenderer } from 'three';

export type ModelViewerEnvironment =
  | 'studio'
  | 'city'
  | 'sunset'
  | 'dawn'
  | 'warehouse'
  | 'apartment'
  | 'lobby'
  | 'night'
  | 'park'
  | 'forest'
  | 'none';

export type ModelViewerIntro = 'rise' | 'spin' | 'fade' | 'none';

export interface ModelViewerProps {
  url?: string;
  width?: number | string;
  height?: number | string;
  environment?: ModelViewerEnvironment;
  environmentIntensity?: number;
  exposure?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  dragRotate?: boolean;
  turntable?: boolean;
  zoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
  hoverTilt?: number;
  float?: number;
  shadow?: boolean;
  shadowOpacity?: number;
  intro?: ModelViewerIntro;
  startAngle?: number;
  tilt?: number;
  offsetX?: number;
  offsetY?: number;
  fit?: number;
  resetOnDoubleClick?: boolean;
  class?: string;
}

export interface ModelViewerExpose {
  /** Returns the current frame as an image data URL. */
  capture: (type?: string) => string | null;
}

export interface ModelBounds {
  scale: number;
  center: Vector3;
  radius: number;
  floor: number;
}

export interface ModelMotion {
  yaw: number;
  pitch: number;
  yawVelocity: number;
  pitchVelocity: number;
  zoom: number;
  zoomGoal: number;
  tiltX: number;
  tiltY: number;
  tiltGoalX: number;
  tiltGoalY: number;
  spinSpeed: number;
  idle: number;
  dragging: boolean;
  intro: number;
  clock: number;
  reset: { yaw: number; pitch: number } | null;
}

export interface ModelPointer {
  x: number;
  y: number;
  t: number;
}

export interface ContactShadowOptions {
  y: number;
  opacity: number;
  scale: number;
  far: number;
}

export interface ContactShadows {
  group: Group;
  configure: (options: ContactShadowOptions) => void;
  render: (renderer: WebGLRenderer, scene: Scene, blur: number) => void;
  dispose: () => void;
}
