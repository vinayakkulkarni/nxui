import type * as THREE from 'three';

export interface RippleImageItem {
  src: string;
  alt?: string;
}

export interface ImageRippleEffectProps {
  images: RippleImageItem[];
  brushTextureUrl?: string;
  distortionStrength?: number;
  waveCount?: number;
  waveSize?: number;
  waveRotationSpeed?: number;
  waveFadeMultiplier?: number;
  waveGrowth?: number;
  waveSpawnThreshold?: number;
  class?: string;
}

export interface ImageRippleWaveMesh {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
}
