import * as THREE from 'three';
import type { ParticleGalaxyBlendMode } from '~/types/components';
import { particleVertexShader, particleFragmentShader } from './shaders';

interface ParticleConfig {
  particleCount: number;
  particleSize: number;
  spiralArms: number;
  colors: [string, string, string];
  blendMode: ParticleGalaxyBlendMode;
  spread: number;
  density: number;
  glow: number;
  centerConcentration: number;
  pulsate: boolean;
  pulsateSpeed: number;
}

export function createGalaxyParticles(config: ParticleConfig) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particleCount * 3);
  const colors = new Float32Array(config.particleCount * 3);
  const scales = new Float32Array(config.particleCount);
  const palette = config.colors.map((c) => new THREE.Color(c));
  const rStr = 0.3 * (config.spread / 2.5);
  const rSign = () => (Math.random() < 0.5 ? 1 : -1);

  for (let i = 0; i < config.particleCount; i++) {
    const i3 = i * 3;
    const radius =
      Math.pow(Math.random(), config.centerConcentration) * config.spread;
    const spin = radius * config.spiralArms;
    const branch =
      ((i % config.spiralArms) / config.spiralArms) * Math.PI * 2 + spin;
    positions[i3] =
      Math.cos(branch) * radius + Math.pow(Math.random(), 3) * rSign() * rStr;
    positions[i3 + 1] = Math.pow(Math.random(), 3) * rSign() * rStr;
    positions[i3 + 2] =
      Math.sin(branch) * radius + Math.pow(Math.random(), 3) * rSign() * rStr;
    const mixed = palette[i % 3]!.clone();
    const cd = radius / config.spread;
    if (config.blendMode === 'normal')
      mixed.lerp(new THREE.Color('#000000'), cd * 0.5);
    else mixed.lerp(new THREE.Color('#ffffff'), 1 - cd);
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
    scales[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: config.particleSize * 100 },
      uGlow: { value: config.glow / 100 },
      uDensity: { value: config.density },
      uPulsate: { value: config.pulsate ? 1.0 : 0.0 },
      uPulsateSpeed: { value: config.pulsateSpeed },
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending:
      config.blendMode === 'additive'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  return { geometry, material, points };
}
