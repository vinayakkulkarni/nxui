<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    GradientWavesProps,
    GradientWavesSettings,
    GradientWavesState,
    UniformName,
    Vec2,
  } from './types';
  import {
    FRAGMENT,
    INTRO_SECONDS,
    MAX_SWELLS,
    QUALITY,
    SWELL_GAIN,
    SWELL_SECONDS,
    SWELL_WIDTH,
    UNIFORM_NAMES,
    VERTEX,
    clamp,
    compileShader,
    easeInOut,
    groundAt,
    parseColor,
  } from './gradient-waves-gl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<GradientWavesProps>(), {
    horizonColor: '#5227FF',
    waveColor: '#FF9FFC',
    crestColor: '#FFFFFF',
    backgroundColor: 'transparent',
    lightMode: false,
    speed: 0.4,
    amplitude: 2.5,
    waveScale: 0.6,
    waveRatio: 0.9,
    swell: 35,
    turbulence: 20,
    tilt: 64,
    zoom: 1,
    height: 5.5,
    fogDepth: 15,
    relief: 1,
    lightAngle: 120,
    sheen: 0,
    brightness: 1,
    opacity: 1,
    grain: 0.2,
    quality: 'medium',
    intro: true,
    mouseInteraction: true,
    parallaxStrength: 0.5,
    mouseStrength: 0.6,
    swellOnClick: true,
    paused: false,
    dpr: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<GradientWavesSettings>(() => {
    const grain = props.grain;
    return {
      horizon: parseColor(props.horizonColor, [0.32, 0.15, 1]) ?? [
        0.32, 0.15, 1,
      ],
      wave: parseColor(props.waveColor, [1, 0.62, 0.99]) ?? [1, 0.62, 0.99],
      crest: parseColor(props.crestColor, [1, 1, 1]) ?? [1, 1, 1],
      paper: parseColor(props.backgroundColor, null),
      lightMode: props.lightMode,
      speed: props.speed,
      amplitude: Math.max(0, props.amplitude),
      waveScale: Math.max(0.01, props.waveScale),
      waveRatio: Math.max(0.01, props.waveRatio),
      swell: props.swell,
      turbulence: props.turbulence,
      tilt: (clamp(props.tilt, 10, 85) * Math.PI) / 180,
      zoom: Math.max(0.05, props.zoom),
      height: props.height,
      fogDepth: Math.max(0.5, props.fogDepth),
      relief: clamp(props.relief, 0, 1),
      lightAngle: (props.lightAngle * Math.PI) / 180,
      sheen: Math.max(0, props.sheen),
      brightness: Math.max(0, props.brightness),
      opacity: clamp(props.opacity, 0, 1),
      grain: typeof grain === 'number' ? Math.max(0, grain) : grain ? 0.05 : 0,
      steps: QUALITY[props.quality] ?? QUALITY.medium,
      intro: props.intro,
      mouseInteraction: props.mouseInteraction,
      parallaxStrength: Math.max(0, props.parallaxStrength),
      mouseStrength: clamp(props.mouseStrength, 0, 1),
      swellOnClick: props.swellOnClick,
      paused: props.paused,
      dpr: Math.max(0.5, props.dpr),
    };
  });

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  const uniforms = new Map<UniformName, WebGLUniformLocation | null>();
  const swellData = new Float32Array(MAX_SWELLS * 3);

  const state: GradientWavesState = {
    width: 1,
    height: 1,
    cssWidth: 0,
    cssHeight: 0,
    time: 0,
    clock: 0,
    last: 0,
    raf: 0,
    visible: false,
    introAt: -1,
    pointer: [0.5, 0.5],
    inside: false,
    look: [0, 0],
    steer: [0, 0],
    swells: [],
    quiet: 0,
    seen: null,
  };

  const CENTER: Vec2 = [0.5, 0.5];

  const isReduced = () => reducedMotion.value === 'reduce';

  function fit() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, settings.value.dpr);
    const width = Math.max(1, Math.round(state.cssWidth * ratio));
    const height = Math.max(1, Math.round(state.cssHeight * ratio));
    if (width === state.width && height === state.height) return;
    state.quiet = 0;
    state.width = width;
    state.height = height;
    canvas.width = width;
    canvas.height = height;
  }

  function measure() {
    const container = containerRef.value;
    if (!container) return;
    state.cssWidth = container.clientWidth;
    state.cssHeight = container.clientHeight;
    fit();
    wake();
  }

  function introProgress(s: GradientWavesSettings, reduced: boolean) {
    if (!s.intro || reduced || state.introAt < 0) return 1;
    return clamp((state.clock - state.introAt) / INTRO_SECONDS, 0, 1);
  }

  function render(reduced: boolean) {
    if (!gl) return;
    const s = settings.value;
    const u = (name: UniformName) => uniforms.get(name) ?? null;
    gl.viewport(0, 0, state.width, state.height);
    gl.uniform2f(u('uResolution'), state.width, state.height);
    gl.uniform1f(u('uTime'), state.time);
    gl.uniform1f(u('uClock'), state.clock);
    gl.uniform1f(u('uAmplitude'), s.amplitude);
    gl.uniform1f(u('uWaveScale'), s.waveScale);
    gl.uniform1f(u('uWaveRatio'), s.waveRatio);
    gl.uniform1f(u('uSwell'), s.swell);
    gl.uniform1f(u('uTurbulence'), s.turbulence);
    gl.uniform1f(u('uHeight'), s.height);
    gl.uniform1f(u('uTilt'), s.tilt);
    gl.uniform1f(u('uZoom'), s.zoom);
    gl.uniform2f(u('uLook'), state.look[0], state.look[1]);
    gl.uniform1f(u('uFogDepth'), s.fogDepth);
    gl.uniform1f(u('uBrightness'), s.brightness);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.uniform1f(u('uGrain'), s.grain);
    gl.uniform3fv(u('uHorizon'), s.horizon);
    gl.uniform3fv(u('uWave'), s.wave);
    gl.uniform3fv(u('uCrest'), s.crest);
    const paper = s.paper ?? [0, 0, 0];
    gl.uniform3f(u('uBackground'), paper[0], paper[1], paper[2]);
    gl.uniform1f(u('uOpaque'), s.paper ? 1 : 0);
    gl.uniform1f(u('uLight'), s.lightMode ? 1 : 0);
    const elevation = 0.52;
    const angle = s.lightAngle + state.steer[0] * s.mouseStrength * 2;
    const altitude = elevation - state.steer[1] * s.mouseStrength * 0.7;
    gl.uniform3f(
      u('uSun'),
      Math.cos(altitude) * Math.cos(angle),
      Math.cos(altitude) * Math.sin(angle),
      Math.sin(altitude),
    );
    gl.uniform1f(u('uRelief'), s.relief);
    gl.uniform1f(u('uSheen'), s.sheen);
    gl.uniform1f(u('uSteps'), s.steps);
    const slope =
      s.amplitude *
      ((s.waveScale / 7) * (1 + Math.abs(s.swell) / 20) +
        ((s.waveScale * s.waveRatio) / 3) * (1 + Math.abs(s.turbulence) / 23));
    const progress = introProgress(s, reduced);
    const shown = Math.min(1, progress / 0.22);
    const crest =
      160 * Math.pow(3 / 160, easeInOut(Math.max(0, (progress - 0.1) / 0.9)));
    const settle = clamp((progress - 0.75) / 0.25, 0, 1);
    gl.uniform3f(
      u('uIntro'),
      shown * shown * (3 - 2 * shown),
      crest,
      1 - settle * settle * (3 - 2 * settle),
    );
    swellData.fill(0);
    let swellPeak = 0;
    state.swells.forEach((swell, index) => {
      const age = state.clock - swell.at;
      const life = age / SWELL_SECONDS;
      const envelope = (1 - Math.exp(-age / 0.25)) * Math.pow(1 - life, 1.6);
      const lift = s.amplitude * SWELL_GAIN * envelope;
      swellData.set([swell.x - age * 12, swell.y, lift], index * 3);
      swellPeak = Math.max(swellPeak, lift);
    });
    gl.uniform3fv(u('uSwells'), swellData);
    gl.uniform1f(u('uSwellWidth'), SWELL_WIDTH);
    gl.uniform1f(
      u('uStride'),
      0.9 / Math.max(1, (slope + (swellPeak * 0.86) / SWELL_WIDTH) / 1.5),
    );
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now: number) {
    state.raf = 0;
    if (!gl || !state.visible || document.hidden) return;
    const s = settings.value;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 0;
    state.last = now;
    const reduced = isReduced();
    state.clock += dt;
    if (state.introAt < 0) state.introAt = state.clock;
    if (!s.paused && !reduced) state.time += dt * s.speed;

    const steering = s.mouseInteraction && state.inside && !reduced;
    const target: Vec2 = steering ? state.pointer : CENTER;
    const ease = 1 - Math.exp(-dt / 0.45);
    const goalX = (target[0] - 0.5) * s.parallaxStrength * 0.35;
    const goalY = (target[1] - 0.5) * s.parallaxStrength * 0.18;
    state.look[0] += (goalX - state.look[0]) * ease;
    state.look[1] += (goalY - state.look[1]) * ease;
    const moving =
      Math.abs(goalX - state.look[0]) + Math.abs(goalY - state.look[1]) >
      0.0002;

    const steerEase = 1 - Math.exp(-dt / 0.6);
    const steerX = steering ? state.pointer[0] - 0.5 : 0;
    const steerY = steering ? 0.5 - state.pointer[1] : 0;
    state.steer[0] += (steerX - state.steer[0]) * steerEase;
    state.steer[1] += (steerY - state.steer[1]) * steerEase;
    const turning =
      Math.abs(steerX - state.steer[0]) + Math.abs(steerY - state.steer[1]) >
      0.0005;
    state.swells = state.swells.filter(
      (swell) => state.clock - swell.at < SWELL_SECONDS,
    );

    const still = s.paused || reduced;
    const transient =
      moving ||
      turning ||
      state.swells.length > 0 ||
      introProgress(s, reduced) < 1;
    if (state.seen !== s || transient || !still) state.quiet = 0;
    else state.quiet += 1;
    state.seen = s;
    if (state.quiet > 3) return;

    state.raf = requestAnimationFrame(tick);
    fit();
    render(reduced);
  }

  function wake() {
    if (!gl || state.raf || !state.visible || document.hidden) return;
    state.last = 0;
    state.raf = requestAnimationFrame(tick);
  }

  function local(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) / Math.max(rect.height, 1),
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  }

  function onMove(event: PointerEvent) {
    const point = local(event);
    if (!point) return;
    const was = state.inside;
    state.inside = point.inside;
    if (point.inside) state.pointer = [point.x, point.y];
    if ((point.inside || was) && settings.value.mouseInteraction) wake();
  }

  function onLeave() {
    state.inside = false;
    wake();
  }

  function onDown(event: PointerEvent) {
    const s = settings.value;
    if (!s.swellOnClick || event.button !== 0 || isReduced()) return;
    if (
      event.target instanceof Element &&
      event.target.closest(
        'a, button, input, textarea, select, label, [role="button"]',
      )
    )
      return;
    const point = local(event);
    if (!point || !point.inside) return;
    const ground = groundAt(
      [point.x, point.y],
      state.width / Math.max(state.height, 1),
      s,
      state.look,
    );
    if (!ground) return;
    state.swells.push({ x: ground[0], y: ground[1], at: state.clock });
    if (state.swells.length > MAX_SWELLS) state.swells.shift();
    wake();
  }

  function initGl() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const context = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!context) return;
    const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX);
    const fragment = compileShader(context, context.FRAGMENT_SHADER, FRAGMENT);
    const linked = context.createProgram();
    if (!vertex || !fragment || !linked) return;
    context.attachShader(linked, vertex);
    context.attachShader(linked, fragment);
    context.bindAttribLocation(linked, 0, 'aPosition');
    context.linkProgram(linked);
    context.deleteShader(vertex);
    context.deleteShader(fragment);
    if (!context.getProgramParameter(linked, context.LINK_STATUS)) {
      context.deleteProgram(linked);
      return;
    }
    UNIFORM_NAMES.forEach((name) => {
      uniforms.set(name, context.getUniformLocation(linked, name));
    });
    vao = context.createVertexArray();
    context.bindVertexArray(vao);
    buffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      context.STATIC_DRAW,
    );
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
    context.useProgram(linked);
    gl = context;
    program = linked;
  }

  useResizeObserver(containerRef, measure);
  useIntersectionObserver(containerRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  useEventListener('pointermove', onMove, { passive: true });
  useEventListener('pointerdown', onDown);
  useEventListener(
    () => defaultDocument?.documentElement,
    'pointerleave',
    onLeave,
  );
  useEventListener(defaultDocument, 'visibilitychange', wake);

  watch([settings, reducedMotion], wake);

  onMounted(() => {
    initGl();
    measure();
    wake();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
    if (gl) {
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (vao) gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('gradient-waves-container', props.class)">
    <canvas ref="canvasRef" class="gradient-waves-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .gradient-waves-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .gradient-waves-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
