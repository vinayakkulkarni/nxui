export type AeroShardsPlacement = 'full' | 'left' | 'right' | 'center';
export type AeroShardsMaterial = 'glass' | 'chrome';
export type AeroShardsMarkers = 'plus' | 'dots' | 'none';

export interface AeroShardsProps {
  /** Main color of the shards. */
  shardColor?: string;
  /** Color of the light the shards catch, their rim light and the markers. */
  accentColor?: string;
  /** Fills the canvas behind the shards. Transparent lets the page show through. */
  backgroundColor?: string;
  /** Draws the shards as soft tinted glass for light backgrounds. */
  lightMode?: boolean;
  /** Where the ribbons flow: across the whole view, down one side, or in a ring around the center. */
  placement?: AeroShardsPlacement;
  /** Surface of the shards: thick glass that catches light along its edges, or polished chrome. */
  material?: AeroShardsMaterial;
  /** Survey markers floating at each depth. A few blink; the one nearest the cursor gets a target frame. */
  markers?: AeroShardsMarkers;
  /** Number of shards across all the ribbons. */
  count?: number;
  /** Size of the shards. */
  shardSize?: number;
  /** Width of the ribbons. */
  spread?: number;
  /** How much the ribbons twist along their length. */
  twist?: number;
  /** How much the ribbons ripple like silk. */
  billow?: number;
  /** How fast the shards flow. */
  speed?: number;
  /** Zoom of the whole scene. */
  scale?: number;
  /** How soft the farther ribbons get. 0 keeps everything sharp. */
  depthOfField?: number;
  /** Soft bloom around the brightest glints. */
  glow?: number;
  /** Film grain on the shards. 0 turns it off. */
  grain?: number;
  /** Fades everything out toward the edges of the frame. 0 runs edge to edge. */
  vignette?: number;
  /** The ribbons draw in from the left, front to back, on mount. */
  intro?: boolean;
  /** The cursor parts the shards it passes through and leans the camera toward it. */
  mouseInteraction?: boolean;
  /** How strongly the cursor parts the shards. */
  mouseStrength?: number;
  /** How far the camera leans toward the cursor. */
  parallax?: number;
  /** Clicking sends a ring of light out through every depth, flipping the shards it passes. */
  pulseOnClick?: boolean;
  /** Pressing and holding gathers nearby shards into a swirl that scatters back on release. */
  holdToGather?: boolean;
  /** Freezes the flow. */
  paused?: boolean;
  /** Maximum device pixel ratio of the canvas. */
  dpr?: number;
  /** Extra class names for the container. */
  class?: string;
}

export type AeroShardsRgb = [number, number, number];

export interface AeroShardsSettings {
  shard: AeroShardsRgb;
  accent: AeroShardsRgb;
  paper: AeroShardsRgb | null;
  lightMode: boolean;
  placement: number;
  /** 0 = glass, 1 = chrome */
  material: number;
  count: number;
  shardSize: number;
  spread: number;
  twist: number;
  billow: number;
  speed: number;
  scale: number;
  depthOfField: number;
  glow: number;
  grain: number;
  vignette: number;
  intro: boolean;
  mouseInteraction: boolean;
  mouseStrength: number;
  /** 0 = plus, 1 = dots, -1 = none */
  markers: number;
  pulseOnClick: boolean;
  holdToGather: boolean;
  parallax: number;
  paused: boolean;
  dpr: number;
}

export interface AeroShardsSpot {
  /** 0..1 across the container */
  u: number;
  /** 0..1 down the container */
  v: number;
  inside: boolean;
}

export interface AeroShardsEngineOptions {
  reduced: () => boolean;
  ratio: () => number;
}

export interface AeroShardsEngine {
  /** Simulates and draws one frame. Returns false once the scene has settled. */
  frame: (now: number) => boolean;
  /** Re-measures the container on the next frame. */
  invalidate: () => void;
  move: (spot: AeroShardsSpot) => void;
  press: (spot: AeroShardsSpot) => void;
  release: () => void;
  leave: () => void;
  resetClock: () => void;
  destroy: () => void;
}

export interface AeroShardsTarget {
  texture: WebGLTexture;
  depth: WebGLTexture | null;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
}

export interface AeroShardsGroup {
  scale: number;
  layer: AeroShardsTarget;
  shaded: AeroShardsTarget;
  temp: AeroShardsTarget;
  blurred: AeroShardsTarget;
  softReady: boolean;
}

export interface AeroShardsPath {
  position: Float32Array;
  tangent: Float32Array;
  across: Float32Array;
  lift: Float32Array;
  length: number;
}

export interface AeroShardsRing {
  x: number;
  y: number;
  age: number;
}

export interface AeroShardsRingSample extends AeroShardsRing {
  strength: number;
}

export interface AeroShardsLevelPlan {
  group: AeroShardsGroup;
  soft: boolean;
  sigma: number;
  layerView: [number, number, number, number];
  shadow: number;
  step: number;
}

export interface ShardInstance {
  level: number;
  phase: number;
  lane: number;
  layer: number;
  size: number;
  shape: number[];
  sides: number;
  thickness: number;
  yaw: number;
  bank: number;
  pitch: number;
  tint: number;
  drift: [number, number, number];
  rate: [number, number, number];
  flutter: [number, number];
  arrive: number;
  sign: number;
  slot: [number, number, number, number];
  offset: [number, number, number];
  velocity: [number, number, number];
  tilt: number;
  tiltVelocity: number;
  flash: number;
  gather: number;
  joined: boolean;
  position: [number, number, number];
  s: number;
}

export type AeroShardsPreset =
  | 'amethyst'
  | 'glacier'
  | 'copper'
  | 'graphite'
  | 'halo';

export interface AeroShardsLook {
  shardColor: string;
  accentColor: string;
  lightMode: boolean;
  placement: AeroShardsPlacement;
  material: AeroShardsMaterial;
  markers: AeroShardsMarkers;
  count: number;
  shardSize: number;
  spread: number;
  twist: number;
  billow: number;
  speed: number;
  scale: number;
  depthOfField: number;
  glow: number;
  grain: number;
  vignette: number;
}
