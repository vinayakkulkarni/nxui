import type * as THREE from 'three';

export type LanyardOrientation = 'portrait' | 'landscape';

export type LanyardFinish = 'glossy' | 'matte' | 'holographic' | 'metallic';

export type LanyardMetal = 'graphite' | 'silver' | 'gold';

export type LanyardAnchor = 'left' | 'center' | 'right';

export type LanyardImageFit = 'cover' | 'contain';

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  imageFit?: LanyardImageFit;
  cardColor?: string;
  orientation?: LanyardOrientation;
  finish?: LanyardFinish;
  cornerRadius?: number;
  size?: number;
  anchor?: LanyardAnchor;
  strapLength?: number;
  strapImage?: string;
  strapColor?: string;
  strapWidth?: number;
  metal?: LanyardMetal;
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;
  class?: string;
}

export type LanyardRgb = [number, number, number];

export interface LanyardPathLike {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  bezierCurveTo(
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    x: number,
    y: number,
  ): unknown;
}

export interface LanyardImages {
  front: HTMLImageElement | null;
  back: HTMLImageElement | null;
  strap: HTMLImageElement | null;
}

export interface LanyardCardLayout {
  width: number;
  height: number;
  radius: number;
  slot: { width: number; height: number; y: number };
  ringY: number;
  hangY: number;
}

export interface LanyardFinishLook {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  foil: number;
  anisotropy: number;
}

export interface LanyardMetalLook {
  color: string;
  roughness: number;
}

export interface LanyardBody {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  previousQuaternion: THREE.Quaternion;
  angular: THREE.Vector3;
  mass: number;
  inverseInertia: THREE.Vector3;
  hang: THREE.Vector3;
}

export interface LanyardGrab {
  local: THREE.Vector3;
  rotation: THREE.Quaternion;
  reach: number;
  from: THREE.Vector3;
  target: THREE.Vector3;
}

export interface LanyardSimulation {
  nodes: THREE.Vector3[];
  previous: THREE.Vector3[];
  velocities: THREE.Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  rest: number;
  anchor: THREE.Vector3;
  body: LanyardBody;
  grab: LanyardGrab | null;
  turn: number;
  twist: number;
  twistRaw: number;
  calm: number;
}

export interface LanyardPhysics {
  gravity: number;
  hold: number;
  stiffness: number;
  spring: number;
  bandDamping: number;
  linearDrag: number;
  angularDrag: number;
  air: number;
  broadside: number;
  spinAir: number;
  nodeDrag: number;
  nodeAir: number;
  twist: number;
  twistDamping: number;
  grip: number;
  gripDamping: number;
  breeze: number;
}

export interface LanyardApplied {
  layoutKey?: string;
  framingKey?: string;
  imageKey?: string;
  faceKey?: string;
  strapColor?: string;
  strapScale?: number;
}

export interface LanyardPress {
  x: number;
  y: number;
  time: number;
  point: THREE.Vector3;
}

export interface LanyardCardGeometry {
  body: THREE.ExtrudeGeometry;
  face: THREE.ShapeGeometry;
}
