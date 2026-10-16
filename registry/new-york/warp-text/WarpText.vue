<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
  import type { OGLRenderingContext } from 'ogl';
  import { WARP_TEXT_FRAGMENT, WARP_TEXT_VERTEX } from './warp-text-shaders';
  import {
    buildTextCanvas,
    getFontValue,
    getLuminance,
    smooth,
  } from './warp-text-raster';
  import type { WarpTextLens, WarpTextProps, WarpTextUniforms } from './types';

  const props = withDefaults(defineProps<WarpTextProps>(), {
    text: 'Bend the moment',
    color: 'currentColor',
    warpStrength: 0.08,
    warpScale: 1.7,
    speed: 0.55,
    pointerInfluence: 0.42,
    pointerStrength: 0.38,
    refraction: 0.018,
    chromatic: 0,
    ripple: true,
    clickRipple: true,
    idleDrift: 0.2,
    lens: 'bulge',
    intro: true,
    fontSize: 'clamp(3rem, 10vw, 9rem)',
    fontWeight: 800,
    fontFamily: 'inherit',
    letterSpacing: '-0.06em',
    lineHeight: 0.9,
    class: '',
  });

  const LENS_MODES: Record<WarpTextLens, number> = {
    bulge: 0,
    pinch: 1,
    swirl: 2,
  };
  const INTRO_MS = 1600;
  const RIPPLE_LIFE = 1.6;
  const MAX_CLICKS = 4;

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = shallowRef<HTMLCanvasElement>();
  const failed = ref(false);

  const reducedPreference = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();

  let renderer: Renderer | null = null;
  let gl: OGLRenderingContext | null = null;
  let program: Program | null = null;
  let geometry: Triangle | null = null;
  let mesh: Mesh | null = null;
  let texture: Texture | null = null;
  let uniforms: WarpTextUniforms | null = null;

  let disposed = false;
  let contextLost = false;
  let inView = true;
  let reduceMotion = false;
  let rasterVersion = 0;
  let textReady = false;
  let introProgress = 1;
  let lastFrame = 0;
  let frame = 0;
  let lastInk = '';
  let startTime = 0;
  let clickSlot = 0;

  const resolution = new Float32Array([1, 1]);
  const pointerVec = new Float32Array([0.5, 0.5]);
  const pointer = {
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5,
    active: 0,
    activeTarget: 0,
  };
  const clicks: number[][] = Array.from({ length: MAX_CLICKS }, () => [
    0.5, 0.5, 0, 0,
  ]);

  function syncUniforms() {
    if (!uniforms) return;
    uniforms.uWarpStrength.value = props.warpStrength;
    uniforms.uWarpScale.value = props.warpScale;
    uniforms.uSpeed.value = props.speed;
    uniforms.uPointerInfluence.value = props.pointerInfluence;
    uniforms.uPointerStrength.value = props.pointerStrength;
    uniforms.uRefraction.value = props.refraction;
    uniforms.uChromatic.value = props.chromatic;
    uniforms.uRipple.value = props.ripple ? 1 : 0;
    uniforms.uLens.value = LENS_MODES[props.lens] ?? 0;
  }

  function renderOnce() {
    if (disposed || contextLost || !renderer || !mesh) return;
    renderer.render({ scene: mesh });
  }

  async function rasterize() {
    const version = ++rasterVersion;
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // fonts failed to load; draw with fallbacks
      }
    }
    const container = containerRef.value;
    if (disposed || contextLost || version !== rasterVersion) return;
    if (!container || !texture || !uniforms) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lastInk = window.getComputedStyle(container).color;
    const raster = buildTextCanvas(container, rect.width, rect.height, dpr, {
      text: props.text,
      color: props.color,
      fontSize: props.fontSize,
      fontWeight: props.fontWeight,
      fontFamily: props.fontFamily,
      letterSpacing: props.letterSpacing,
      lineHeight: props.lineHeight,
    });
    texture.image = raster.canvas;
    texture.needsUpdate = true;
    uniforms.uBackdrop.value = getLuminance(raster.ink) < 0.5 ? 1 : 0;
    textReady = true;
    renderOnce();
  }

  function resize() {
    const container = containerRef.value;
    if (disposed || contextLost || !container || !renderer || !gl) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(rect.width, rect.height);
    resolution[0] = gl.drawingBufferWidth;
    resolution[1] = gl.drawingBufferHeight;
    void rasterize();
  }

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      if (disposed || contextLost || !uniforms) return;
      const container = containerRef.value;
      const now = timestamp;
      const elapsed = (now - startTime) * 0.001;
      const delta = lastFrame ? Math.min(now - lastFrame, 50) : 16;
      lastFrame = now;
      frame += 1;

      if (textReady && introProgress < 1) {
        introProgress = Math.min(1, introProgress + delta / INTRO_MS);
      }
      const settle = 1 - introProgress;

      if (
        textReady &&
        container &&
        frame % 15 === 0 &&
        window.getComputedStyle(container).color !== lastInk
      ) {
        void rasterize();
      }

      const drift = Math.min(Math.max(props.idleDrift, 0), 1);
      const engaged = pointer.activeTarget > 0;
      const idleX = 0.5 + Math.sin(elapsed * 0.33) * (0.08 + drift * 0.2);
      const idleY = 0.5 + Math.cos(elapsed * 0.27) * (0.06 + drift * 0.2);
      const follow = 1 - Math.exp(-delta / (engaged ? 130 : 470));

      pointer.x += ((engaged ? pointer.tx : idleX) - pointer.x) * follow;
      pointer.y += ((engaged ? pointer.ty : idleY) - pointer.y) * follow;
      pointer.active +=
        ((engaged ? 1 : drift) - pointer.active) * (1 - Math.exp(-delta / 270));

      for (const click of clicks) {
        if ((click[3] ?? 0) <= 0) continue;
        click[2] = (click[2] ?? 0) + delta / 1000;
        if ((click[2] ?? 0) > RIPPLE_LIFE) click[3] = 0;
      }

      pointerVec[0] = pointer.x;
      pointerVec[1] = pointer.y;
      uniforms.uPointerActive.value = reduceMotion
        ? pointer.active * 0.35
        : pointer.active;
      uniforms.uTime.value = reduceMotion ? 0 : elapsed;
      uniforms.uIntro.value = settle * settle * settle;
      uniforms.uReveal.value = textReady
        ? smooth(Math.min(1, introProgress / 0.45))
        : 0;

      renderOnce();
    },
    { immediate: false },
  );

  function updateLoop() {
    if (disposed || contextLost || !uniforms) {
      pause();
      return;
    }
    if (inView && pageVisibility.value === 'visible') resume();
    else pause();
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointer.tx = (event.clientX - rect.left) / rect.width;
    pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
    pointer.activeTarget = 1;
  }

  function onPointerLeave() {
    pointer.activeTarget = 0;
  }

  function onPointerDown(event: PointerEvent) {
    if (!props.clickRipple) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const click = clicks[clickSlot]!;
    clickSlot = (clickSlot + 1) % clicks.length;
    click[0] = (event.clientX - rect.left) / rect.width;
    click[1] = 1 - (event.clientY - rect.top) / rect.height;
    click[2] = 0;
    click[3] = reduceMotion ? 0.35 : 1;
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    pause();
    failed.value = true;
  }

  useEventListener(canvasRef, 'pointermove', onPointerMove);
  useEventListener(canvasRef, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'pointerdown', onPointerDown);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);

  useResizeObserver(containerRef, resize);
  useIntersectionObserver(
    containerRef,
    (entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      updateLoop();
    },
    { threshold: 0 },
  );
  watch(pageVisibility, updateLoop);

  watch(reducedPreference, (value) => {
    reduceMotion = value === 'reduce';
    if (reduceMotion) introProgress = 1;
    if (uniforms) uniforms.uMotion.value = reduceMotion ? 0 : 1;
    renderOnce();
  });

  watch(
    [
      () => props.warpStrength,
      () => props.warpScale,
      () => props.speed,
      () => props.pointerInfluence,
      () => props.pointerStrength,
      () => props.refraction,
      () => props.chromatic,
      () => props.ripple,
      () => props.lens,
    ],
    syncUniforms,
  );

  watch(
    [
      () => props.text,
      () => props.color,
      () => props.fontSize,
      () => props.fontWeight,
      () => props.fontFamily,
      () => props.letterSpacing,
      () => props.lineHeight,
    ],
    () => {
      void rasterize();
    },
  );

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    reduceMotion = reducedPreference.value === 'reduce';
    introProgress = props.intro && !reduceMotion ? 0 : 1;
    startTime = performance.now();

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
      gl = renderer.gl;
    } catch (error) {
      console.warn('WarpText: WebGL could not be initialized.', error);
      failed.value = true;
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    texture = new Texture(gl, {
      generateMipmaps: false,
      premultiplyAlpha: true,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });

    uniforms = {
      uTextTexture: { value: texture },
      uResolution: { value: resolution },
      uPointer: { value: pointerVec },
      uPointerActive: { value: 0 },
      uTime: { value: 0 },
      uWarpStrength: { value: props.warpStrength },
      uWarpScale: { value: props.warpScale },
      uSpeed: { value: props.speed },
      uPointerInfluence: { value: props.pointerInfluence },
      uPointerStrength: { value: props.pointerStrength },
      uRefraction: { value: props.refraction },
      uChromatic: { value: props.chromatic },
      uRipple: { value: props.ripple ? 1 : 0 },
      uMotion: { value: reduceMotion ? 0 : 1 },
      uLens: { value: LENS_MODES[props.lens] ?? 0 },
      uIntro: { value: 0 },
      uReveal: { value: 0 },
      uBackdrop: { value: 0 },
      uClicks: { value: clicks },
    };

    geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: WARP_TEXT_VERTEX,
      fragment: WARP_TEXT_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
    });
    mesh = new Mesh(gl, { geometry, program });

    canvasRef.value = canvas;
    syncUniforms();
    resize();
    updateLoop();
  });

  onBeforeUnmount(() => {
    disposed = true;
    pause();
    const canvas = canvasRef.value;
    if (gl && !contextLost) {
      try {
        if (texture?.texture) gl.deleteTexture(texture.texture);
        geometry?.remove();
        program?.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // context already gone
      }
    }
    if (canvas && canvas.parentNode === containerRef.value) canvas.remove();
    canvasRef.value = undefined;
    renderer = null;
    gl = null;
    program = null;
    geometry = null;
    mesh = null;
    texture = null;
    uniforms = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['warp-text', props.class]"
    role="img"
    :aria-label="props.text"
  >
    <span
      v-if="failed"
      class="warp-text__fallback"
      aria-hidden="true"
      :style="{
        color: props.color,
        fontFamily: props.fontFamily,
        fontWeight: props.fontWeight,
        fontSize: getFontValue(props.fontSize),
        letterSpacing: getFontValue(props.letterSpacing),
        lineHeight: props.lineHeight,
      }"
    >
      {{ props.text }}
    </span>
  </div>
</template>

<style scoped>
  .warp-text {
    position: relative;
    display: block;
    width: 100%;
    min-height: 220px;
    overflow: hidden;
    isolation: isolate;
    border-radius: inherit;
  }

  .warp-text :deep(canvas) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .warp-text__fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 7%;
    text-align: center;
    white-space: pre-line;
  }
</style>
