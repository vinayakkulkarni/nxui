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
