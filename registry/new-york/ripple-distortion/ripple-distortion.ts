import {
  Geometry,
  Mesh,
  Program,
  RenderTarget,
  Renderer,
  Texture,
  Triangle,
} from 'ogl';
import type { Attribute } from 'ogl';
import {
  compositeFragment,
  screenVertex,
  waveFragment,
  waveVertex,
} from './shaders';
import type {
  CompositeUniforms,
  Rgb,
  RippleDistortionEngine,
  RippleDistortionProps,
  RippleQuality,
  Wave,
  WaveConfig,
  WaveUniforms,
} from './types';

const MAX_WAVES = 100;
const QUALITY_SCALE: Record<RippleQuality, number> = {
  low: 0.4,
  medium: 0.7,
  high: 1,
};
const START_SCALE = 1.5;
const LIFE_CONSTANT = Math.log(500);

const DEFAULT_SRC =
  'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

function hexToRGB(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildConfig(props: RippleDistortionProps): WaveConfig {
  return {
    brushSize: props.brushSize ?? 150,
    spread: props.spread ?? 5,
    fade: props.fade ?? 3,
    spacing: props.spacing ?? 15,
    clickStrength: props.clickStrength ?? 2,
    trigger: props.trigger ?? 'hover',
    enabled: props.enabled ?? true,
  };
}

/**
 * Two-pass ogl renderer: instanced ripple quads are additively splatted into a
 * low-res displacement buffer, then a full-screen pass pushes, swirls, splits
 * and tints the cover-fitted image by that buffer.
 */
export function createRippleDistortion(
  canvas: HTMLCanvasElement,
  getProps: () => RippleDistortionProps,
  getReduceMotion: () => boolean,
): RippleDistortionEngine {
  const props = getProps();
  const quality = QUALITY_SCALE[props.quality ?? 'low'] ?? QUALITY_SCALE.high;

  const renderer = new Renderer({
    canvas,
    alpha: false,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 1);

  const imageTexture = new Texture(gl, {
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });

  const offsets = new Float32Array(MAX_WAVES * 2);
  const scales = new Float32Array(MAX_WAVES * 2);
  const opacities = new Float32Array(MAX_WAVES);
  const offsetAttr: Partial<Attribute> = {
    instanced: 1,
    size: 2,
    data: offsets,
  };
  const scaleAttr: Partial<Attribute> = { instanced: 1, size: 2, data: scales };
  const opacityAttr: Partial<Attribute> = {
    instanced: 1,
    size: 1,
    data: opacities,
  };

  const waves: Wave[] = Array.from({ length: MAX_WAVES }, () => ({
    x: 0,
    y: 0,
    scale: START_SCALE,
    target: START_SCALE,
    size: 1,
    opacity: 0,
  }));
  let current = 0;

  const geometry = new Geometry(gl, {
    position: {
      size: 2,
      data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    },
    uv: {
      size: 2,
      data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    },
    iOffset: offsetAttr,
    iScale: scaleAttr,
    iOpacity: opacityAttr,
  });

  const waveUniforms: WaveUniforms = { uRings: { value: props.rings ?? 4 } };
  const waveProgram = new Program(gl, {
    vertex: waveVertex,
    fragment: waveFragment,
    uniforms: waveUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
  });
  waveProgram.setBlendFunc(gl.ONE, gl.ONE);
  const waveMesh = new Mesh(gl, {
    geometry,
    program: waveProgram,
    frustumCulled: false,
  });

  const displacementTarget = new RenderTarget(gl, {
    width: 2,
    height: 2,
    depth: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });

  const compositeUniforms: CompositeUniforms = {
    uTexture: { value: imageTexture },
    uDisplacement: { value: displacementTarget.texture },
    uResolution: { value: [1, 1] },
    uTextureSize: { value: [1, 1] },
    uTexel: { value: [1, 1] },
    uTint: { value: hexToRGB(props.tint ?? '#a855f7') },
    uHighlight: { value: hexToRGB(props.highlightColor ?? '#ffffff') },
    uStrength: { value: props.strength ?? 0.2 },
    uSwirl: { value: props.swirl ?? 1 },
    uDispersion: { value: props.dispersion ?? 0 },
    uGlint: { value: props.glint ?? 0 },
    uTintAmount: { value: props.tintAmount ?? 0.1 },
    uGrayscale: { value: (props.grayscale ?? true) ? 1 : 0 },
  };

  const compositeMesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex: screenVertex,
      fragment: compositeFragment,
      uniforms: compositeUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  });

  let disposed = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.addEventListener('load', () => {
    if (disposed) return;
    imageTexture.image = image;
    compositeUniforms.uTextureSize.value = [
      image.naturalWidth || 1,
      image.naturalHeight || 1,
    ];
  });
  image.src = props.src ?? DEFAULT_SRC;

  let width = 1;
  let height = 1;

  const setNewWave = (x: number, y: number, power: number) => {
    const cfg = buildConfig(getProps());
    const wave = waves[current];
    current = (current + 1) % MAX_WAVES;
    if (!wave) return;
    wave.x = x;
    wave.y = y;
    wave.scale = START_SCALE * power;
    wave.target = START_SCALE * Math.max(1, cfg.spread) * power;
    wave.size = Math.max(1, cfg.brushSize);
    wave.opacity = 1;
  };

  const localPoint = (
    clientX: number,
    clientY: number,
  ): [number, number] | null => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    return [clientX - rect.left, rect.height - (clientY - rect.top)];
  };

  let previousX = 0;
  let previousY = 0;
  let raf = 0;
  let previousTime = 0;
  let visible = true;

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const delta = previousTime
      ? Math.min(0.05, (now - previousTime) / 1000)
      : 0;
    previousTime = now;
    const cfg = buildConfig(getProps());
    const reduce = getReduceMotion();

    const growth = reduce ? 0 : 1 - Math.exp(-delta * 1.09);
    const decay = reduce
      ? 1
      : Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, cfg.fade));

    waves.forEach((wave, i) => {
      if (wave.opacity <= 0) {
        opacities[i] = 0;
        return;
      }

      wave.opacity *= decay;
      wave.scale += (wave.target - wave.scale) * growth;

      if (wave.opacity < 0.002) {
        wave.opacity = 0;
        opacities[i] = 0;
        return;
      }

      const half = (wave.scale * wave.size) / 2;
      offsets[i * 2] = (wave.x / width) * 2 - 1;
      offsets[i * 2 + 1] = (wave.y / height) * 2 - 1;
      scales[i * 2] = (half / width) * 2;
      scales[i * 2 + 1] = (half / height) * 2;
      opacities[i] = wave.opacity;
    });

    offsetAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;

    renderer.render({
      scene: waveMesh,
      target: displacementTarget,
      clear: true,
    });
    renderer.render({ scene: compositeMesh });
  };
  raf = requestAnimationFrame(loop);

  return {
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.setSize(width, height);
      compositeUniforms.uResolution.value = [width, height];
      const fieldW = Math.max(2, Math.round(width * quality));
      const fieldH = Math.max(2, Math.round(height * quality));
      displacementTarget.setSize(fieldW, fieldH);
      compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH];
    },
    pointerMove(clientX, clientY) {
      const cfg = buildConfig(getProps());
      if (!cfg.enabled || getReduceMotion() || cfg.trigger === 'click') return;
      const point = localPoint(clientX, clientY);
      if (!point) return;
      const step = Math.max(1, cfg.spacing);
      if (
        Math.abs(point[0] - previousX) > step ||
        Math.abs(point[1] - previousY) > step
      ) {
        setNewWave(point[0], point[1], 1);
        previousX = point[0];
        previousY = point[1];
      }
    },
    pointerDown(clientX, clientY) {
      const cfg = buildConfig(getProps());
      if (!cfg.enabled || getReduceMotion() || cfg.trigger === 'hover') return;
      const point = localPoint(clientX, clientY);
      if (!point) return;
      setNewWave(point[0], point[1], Math.max(1, cfg.clickStrength));
    },
    updateUniforms() {
      const p = getProps();
      waveUniforms.uRings.value = p.rings ?? 4;
      compositeUniforms.uStrength.value = p.strength ?? 0.2;
      compositeUniforms.uSwirl.value = p.swirl ?? 1;
      compositeUniforms.uDispersion.value = p.dispersion ?? 0;
      compositeUniforms.uGlint.value = p.glint ?? 0;
      compositeUniforms.uTintAmount.value = p.tintAmount ?? 0.1;
      compositeUniforms.uGrayscale.value = (p.grayscale ?? true) ? 1 : 0;
      compositeUniforms.uHighlight.value = hexToRGB(
        p.highlightColor ?? '#ffffff',
      );
      compositeUniforms.uTint.value = hexToRGB(p.tint ?? '#a855f7');
    },
    setVisible(next) {
      if (next === visible || disposed) return;
      visible = next;
      if (visible) {
        previousTime = 0;
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
