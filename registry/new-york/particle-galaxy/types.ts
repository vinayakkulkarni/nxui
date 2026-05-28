export interface GalaxyParticle {
  x: number;
  y: number;
  z: number;
  angle: number;
  radius: number;
  size: number;
  speed: number;
  arm: number;
}

export type ParticleGalaxyBlendMode = 'additive' | 'normal';
