<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    HOLO_CARD_RATIO,
    HOLO_FRAGMENT,
    HOLO_PERSPECTIVE,
    HOLO_PRESETS,
    HOLO_UNIFORMS,
    HOLO_VERTEX,
    clamp,
    compileShader,
    parseFoilColor,
    springStep,
  } from './holo-shader';
  import type {
    HoloCardMotion,
    HoloCardPointer,
    HoloCardProps,
    HoloCardSettings,
  } from './types';

  const props = withDefaults(defineProps<HoloCardProps>(), {
    image: undefined,
    backImage: undefined,
    alt: '',
    preset: 'bursts',
    intensity: 0.85,
    scale: 1,
    edgeSparkle: 0.8,
    frame: 4,
    glare: 0.5,
    foilColor: '#e2e6ec',
    width: 320,
    radius: 14,
    tiltMax: 14,
    hoverScale: 1.04,
    idle: true,
    shadow: true,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const rotorRef = ref<HTMLDivElement | null>(null);
  const shadowRef = ref<HTMLSpanElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const ratio = ref(HOLO_CARD_RATIO);
  const ready = ref(false);
  const flipped = ref(false);
  const flippable = computed(() => Boolean(props.backImage));

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const foil = computed(() => parseFoilColor(props.foilColor));
  const settings = computed<HoloCardSettings>(() => ({
    preset: Math.max(0, HOLO_PRESETS.indexOf(props.preset)),
    intensity: clamp(props.intensity, 0, 1),
    scale: clamp(props.scale, 0.25, 4),
    edgeSparkle: clamp(props.edgeSparkle, 0, 1),
    frame: clamp(props.frame, 0, 20) / 100,
    glare: clamp(props.glare, 0, 1),
    foil: foil.value,
    radius: Math.max(0, props.radius),
    tiltMax: clamp(props.tiltMax, 0, 45),
    hoverScale: clamp(props.hoverScale, 0.8, 1.3),
    idle: props.idle,
  }));

  const rootStyle = computed(() => ({
    '--hc-w': `${props.width}px`,
    '--hc-ratio': `${ratio.value}`,
    '--hc-radius': `${props.radius}px`,
  }));

  const pointer: HoloCardPointer = { x: 0.5, y: 0.5, inside: false };
  const state: HoloCardMotion = {
    tiltX: 0,
    tiltY: 0,
    tiltVX: 0,
    tiltVY: 0,
    lightX: 0.36,
    lightY: 0.26,
    lightVX: 0,
    lightVY: 0,
    lift: 1,
    liftV: 0,
    turn: 0,
    turnV: 0,
    clock: 0,
  };

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;
  let buffer: WebGLBuffer | null = null;
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  let textureReady = false;
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = false;
  let calm = 0;
  let loadToken = 0;

  const loc = (name: string) => uniforms.get(name) ?? null;

  function setupGl(canvas: HTMLCanvasElement): void {
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) return;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, HOLO_VERTEX);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, HOLO_FRAGMENT);
    if (vertex && fragment) {
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, 'position');
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        program = null;
      }
    }
    if (!program) return;
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    for (const name of HOLO_UNIFORMS) {
      uniforms.set(name, gl.getUniformLocation(program, name));
    }
  }

  function draw(): void {
    const canvas = canvasRef.value;
    if (!gl || !program || !canvas) return;
    const s = settings.value;
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;
    const cssWidth = Math.max(1, canvas.clientWidth);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(loc('uArt'), 0);
    gl.uniform2f(loc('uSize'), w, h);
    gl.uniform1f(loc('uAspect'), h / w);
    gl.uniform2f(
      loc('uTilt'),
      (state.tiltX * Math.PI) / 180,
      ((state.tiltY + state.turn) * Math.PI) / 180,
    );
    gl.uniform2f(loc('uLight'), state.lightX, state.lightY);
    gl.uniform1f(loc('uDistance'), HOLO_PERSPECTIVE / cssWidth);
    gl.uniform1i(loc('uPreset'), s.preset);
    gl.uniform1f(loc('uIntensity'), s.intensity);
    gl.uniform1f(loc('uScale'), s.scale);
    gl.uniform1f(loc('uEdge'), s.edgeSparkle);
    gl.uniform1f(loc('uFrame'), s.frame);
    gl.uniform1f(loc('uRadius'), s.radius / cssWidth);
    gl.uniform1f(loc('uGlare'), s.glare);
    gl.uniform3f(loc('uFoil'), s.foil[0], s.foil[1], s.foil[2]);
    gl.uniform1f(loc('uReady'), textureReady ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now: number): void {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
    last = now;
    const s = settings.value;
    const still = reduce.value;
    const flipTarget = flippable.value && flipped.value ? 180 : 0;
    let targetX = 0;
    let targetY = 0;
    let lightX = 0.36;
    let lightY = 0.26;
    let lift = 1;
    const drifting = s.idle && !still && !pointer.inside;
    if (pointer.inside && !still) {
      targetX = (0.5 - pointer.y) * 2 * s.tiltMax;
      targetY = (pointer.x - 0.5) * 2 * s.tiltMax;
      lightX = pointer.x;
      lightY = pointer.y;
      lift = s.hoverScale;
    } else if (drifting) {
      state.clock += dt;
      const t = state.clock;
      targetX = Math.sin(t * 0.7) * s.tiltMax * 0.28;
      targetY = Math.sin(t * 0.53 + 1.2) * s.tiltMax * 0.4;
      lightX = 0.5 + Math.sin(t * 0.41) * 0.42;
      lightY = 0.38 + Math.sin(t * 0.33 + 0.6) * 0.3;
    }
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      [state.tiltX, state.tiltVX] = springStep(
        state.tiltX,
        state.tiltVX,
        targetX,
        150,
        16,
        h,
      );
      [state.tiltY, state.tiltVY] = springStep(
        state.tiltY,
        state.tiltVY,
        targetY,
        150,
        16,
        h,
      );
      [state.lightX, state.lightVX] = springStep(
        state.lightX,
        state.lightVX,
        lightX,
        220,
        30,
        h,
      );
      [state.lightY, state.lightVY] = springStep(
        state.lightY,
        state.lightVY,
        lightY,
        220,
        30,
        h,
      );
      [state.lift, state.liftV] = springStep(
        state.lift,
        state.liftV,
        lift,
        320,
        30,
        h,
      );
      [state.turn, state.turnV] = still
        ? [flipTarget, 0]
        : springStep(state.turn, state.turnV, flipTarget, 170, 20, h);
    }
    const rotor = rotorRef.value;
    if (rotor) {
      rotor.style.transform = `perspective(${HOLO_PERSPECTIVE}px) scale(${state.lift}) rotateX(${state.tiltX}deg) rotateY(${state.tiltY + state.turn}deg)`;
    }
    const shade = shadowRef.value;
    if (shade) {
      shade.style.transform = `translate(${-state.tiltY * 0.7}px, ${state.tiltX * 0.7}px) scale(${0.9 + (state.lift - 1) * 1.5})`;
    }
    if (Math.cos(((state.tiltY + state.turn) * Math.PI) / 180) > -0.05) draw();
    const moving =
      Math.abs(state.tiltVX) +
      Math.abs(state.tiltVY) +
      Math.abs(state.liftV) * 40 +
      Math.abs(state.turnV) +
      (Math.abs(state.lightVX) + Math.abs(state.lightVY)) * 60 +
      Math.abs(state.tiltX - targetX) +
      Math.abs(state.tiltY - targetY);
    calm = moving > 0.02 ? 0 : calm + dt;
    if (!visible || (!drifting && !pointer.inside && calm > 0.3)) return;
    raf = requestAnimationFrame(tick);
  }

  function wake(): void {
    if (raf || !alive) return;
    calm = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function resize(): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
    wake();
  }

  function load(src: string | undefined): void {
    textureReady = false;
    ready.value = false;
    const token = ++loadToken;
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (!alive || token !== loadToken) return;
      if (img.naturalWidth && img.naturalHeight) {
        ratio.value = img.naturalWidth / img.naturalHeight;
      }
      if (!gl || !program) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        textureReady = true;
        ready.value = true;
        draw();
        wake();
      } catch {
        textureReady = false;
      }
    };
    img.src = src;
  }

  useResizeObserver(canvasRef, resize);
  useIntersectionObserver(rootRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    alive = true;
    state.clock = Math.random() * 40;
    setupGl(canvas);
    load(props.image);
    resize();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (gl) {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }
    gl = null;
    program = null;
  });

  watch(
    () => props.image,
    (src) => load(src),
  );
  watch([settings, flipped, flippable, reduce], () => wake());

  function track(event: PointerEvent): void {
    if (
      event.pointerType === 'touch' &&
      event.type === 'pointermove' &&
      !event.buttons
    ) {
      return;
    }
    const el = event.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const rect = el.getBoundingClientRect();
    pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    pointer.inside = true;
    wake();
  }

  function leave(): void {
    pointer.inside = false;
    wake();
  }

  function toggle(): void {
    if (flippable.value) flipped.value = !flipped.value;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!flippable.value || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) toggle();
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="['holo-card', props.class]"
    :role="flippable ? 'button' : 'img'"
    :tabindex="flippable ? 0 : undefined"
    :aria-label="alt || undefined"
    :aria-pressed="flippable ? flipped : undefined"
    :data-ready="ready ? '' : undefined"
    :data-flippable="flippable ? '' : undefined"
    :style="rootStyle"
    @pointerenter="track"
    @pointermove="track"
    @pointerdown="track"
    @pointerleave="leave"
    @pointercancel="leave"
    @click="toggle"
    @keydown="onKeydown"
  >
    <span
      v-if="shadow"
      ref="shadowRef"
      class="holo-card__shadow"
      aria-hidden="true"
    />
    <div ref="rotorRef" class="holo-card__rotor">
      <div class="holo-card__face holo-card__face--front">
        <img v-if="image" :src="image" alt="" draggable="false" />
        <canvas ref="canvasRef" />
      </div>
      <div v-if="flippable" class="holo-card__face holo-card__face--back">
        <img :src="backImage" alt="" draggable="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .holo-card {
    --hc-w: 320px;
    --hc-ratio: 0.716;
    --hc-radius: 14px;

    position: relative;
    display: inline-block;
    width: var(--hc-w);
    max-width: 100%;
    aspect-ratio: var(--hc-ratio);
    border-radius: var(--hc-radius);
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }

  .holo-card[data-flippable] {
    cursor: pointer;
  }

  .holo-card[data-flippable]:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 6px;
  }

  .holo-card__shadow {
    position: absolute;
    inset: 10% 7% -4%;
    border-radius: var(--hc-radius);
    background: rgba(0, 0, 0, 0.42);
    filter: blur(26px);
    pointer-events: none;
    will-change: transform;
  }

  .holo-card__rotor {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .holo-card__face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: var(--hc-radius);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .holo-card__face--back {
    transform: rotateY(180deg);
  }

  .holo-card__face img,
  .holo-card__face canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .holo-card__face img {
    object-fit: cover;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .holo-card__face canvas {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .holo-card[data-ready] .holo-card__face canvas {
    opacity: 1;
  }
</style>
