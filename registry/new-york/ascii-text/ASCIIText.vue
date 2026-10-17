<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    ASCII_CHARSET,
    ASCII_COLORS,
    ASCII_FONT,
    GLYPH_HEIGHT,
    RIPPLES,
    TEXT_PX,
    UNIFORM_NAMES,
    clamp,
    createProgram,
    drawGlyphs,
    drawText,
    toRgb,
    uploadTexture,
  } from './ascii-text-gl';
  import type { UniformName } from './ascii-text-gl';
  import type {
    ASCIITextProps,
    ASCIITextRipple,
    ASCIITextSettings,
  } from './types';

  const props = withDefaults(defineProps<ASCIITextProps>(), {
    text: 'Hey!',
    asciiFontSize: 8,
    charset: ASCII_CHARSET,
    fontFamily: ASCII_FONT,
    fontWeight: 600,
    textColor: '#fdf9f3',
    colors: () => [...ASCII_COLORS],
    textScale: 1,
    blocks: 0.9,
    waves: 1,
    waveSpeed: 1,
    chroma: 1,
    tilt: 1,
    hueShift: 1,
    scramble: 0.6,
    clickRipple: true,
    intro: true,
    idle: true,
    interactive: true,
    theme: 'dark',
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const fallback = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  const glyphs = computed(() =>
    Array.from(props.charset).length > 1 ? props.charset : ASCII_CHARSET,
  );

  const settings = computed<ASCIITextSettings>(() => {
    const palette = (
      props.colors.length > 0 ? props.colors : ['#ffffff']
    ).slice(0, 3);
    const first = palette[0] ?? '#ffffff';
    const second = palette[1] ?? first;
    return {
      cellSize: Math.max(3, props.asciiFontSize),
      textScale: clamp(props.textScale, 0.1, 3),
      blocks: clamp(props.blocks, 0, 1),
      waves: Math.max(0, props.waves),
      waveSpeed: Math.max(0, props.waveSpeed),
      chroma: Math.max(0, props.chroma),
      tilt: Math.max(0, props.tilt),
      hueShift: clamp(props.hueShift, 0, 2),
      scramble: clamp(props.scramble, 0, 1),
      clickRipple: props.clickRipple,
      intro: props.intro,
      idle: props.idle,
      interactive: props.interactive,
      light: props.theme === 'light',
      colors: [first, second, palette[2] ?? second],
    };
  });

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let textTexture: WebGLTexture | null = null;
  let glyphTexture: WebGLTexture | null = null;
  const uniforms = new Map<UniformName, WebGLUniformLocation | null>();
  const rippleData = new Float32Array(RIPPLES * 4);
  const colorData = new Float32Array(9);
  let colorKey = '';
  let buildToken = 0;
  let mounted = false;

  const state = {
    ready: false,
    textAspect: 1,
    glyphCount: 1,
    time: 0,
    tiltX: 0,
    tiltY: 0,
    hue: 0,
    hover: 0,
    intro: 0,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    inside: false,
    visible: true,
    introPlayed: false,
    ripples: [] as ASCIITextRipple[],
  };

  function loc(name: UniformName): WebGLUniformLocation | null {
    return uniforms.get(name) ?? null;
  }

  function isReduced(): boolean {
    return reducedMotion.value === 'reduce';
  }

  function build(): void {
    if (!gl || !textTexture || !glyphTexture) return;
    const textCanvas = drawText(
      props.text,
      props.fontFamily,
      props.fontWeight,
      props.textColor,
    );
    const glyphCanvas = drawGlyphs(glyphs.value, props.fontFamily);
    if (!textCanvas || !glyphCanvas) return;
    uploadTexture(gl, textTexture, textCanvas, false);
    uploadTexture(gl, glyphTexture, glyphCanvas, true);
    state.textAspect = textCanvas.width / textCanvas.height;
    state.glyphCount = Array.from(glyphs.value).length;
    state.ready = true;
    if (settings.value.intro && !state.introPlayed && !isReduced()) {
      state.introPlayed = true;
      state.intro = 1;
    }
  }

  function rebuild(): void {
    if (!mounted) return;
    const token = ++buildToken;
    const run = () => {
      if (token === buildToken && mounted) build();
    };
    run();
    const fonts = document.fonts;
    Promise.all([
      fonts.load(
        `${props.fontWeight} ${TEXT_PX}px ${props.fontFamily}`,
        props.text || 'A',
      ),
      fonts.load(`500 ${GLYPH_HEIGHT}px ${props.fontFamily}`, glyphs.value),
    ])
      .catch(() => null)
      .then(run);
  }

  function onFontsLoaded(): void {
    if (mounted) build();
  }

  function resize(): void {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(container.clientWidth * dpr));
    const height = Math.max(1, Math.round(container.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function frame(deltaMs: number): void {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!gl || !program || !container || !canvas) return;
    const s = settings.value;
    const reduce = isReduced();
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    state.time += reduce ? 0 : dt;
    const dpr = canvas.width / Math.max(1, container.clientWidth);

    let targetX = 0;
    let targetY = 0;
    if (s.interactive && state.inside) {
      targetX = state.targetY * 0.5 * s.tilt;
      targetY = state.targetX * 0.5 * s.tilt;
    } else if (s.idle && !reduce) {
      targetX = Math.sin(state.time * 0.55) * 0.12 * s.tilt;
      targetY = Math.sin(state.time * 0.4 + 1.3) * 0.2 * s.tilt;
    }
    const follow = 1 - Math.exp(-dt / 0.3);
    state.tiltX += (targetX - state.tiltX) * follow;
    state.tiltY += (targetY - state.tiltY) * follow;
    const angle = Math.atan2(state.targetY, state.targetX);
    const hueTarget =
      s.interactive && state.inside ? angle * s.hueShift : state.hue;
    let delta = hueTarget - state.hue;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    state.hue += delta * (1 - Math.exp(-dt / 0.25));
    state.hover +=
      ((s.interactive && state.inside ? 1 : 0) - state.hover) *
      (1 - Math.exp(-dt / 0.2));
    if (state.intro > 0) state.intro = Math.max(0, state.intro - dt / 1.4);

    rippleData.fill(0);
    state.ripples = state.ripples.filter((ripple) => (ripple.age += dt) < 1.3);
    state.ripples.slice(-RIPPLES).forEach((ripple, i) => {
      rippleData.set([ripple.x * dpr, ripple.y * dpr, ripple.age, 1], i * 4);
    });

    const width = canvas.width;
    const height = canvas.height;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.uniform1i(loc('uText'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glyphTexture);
    gl.uniform1i(loc('uGlyphs'), 1);
    gl.uniform2f(loc('uSize'), width, height);
    gl.uniform2f(loc('uCell'), s.cellSize * 0.62 * dpr, s.cellSize * dpr);
    gl.uniform1f(loc('uGlyphCount'), state.glyphCount);
    gl.uniform1f(loc('uTextAspect'), state.textAspect);
    gl.uniform1f(loc('uPlaneHeight'), 0.5 * s.textScale);
    gl.uniform2f(loc('uTilt'), state.tiltX, state.tiltY);
    gl.uniform1f(loc('uTime'), state.time);
    gl.uniform1f(loc('uWaves'), s.waves);
    gl.uniform1f(loc('uWaveSpeed'), s.waveSpeed);
    gl.uniform1f(loc('uChroma'), s.chroma);
    gl.uniform1f(loc('uBlocks'), s.blocks);
    const key = s.colors.join();
    if (key !== colorKey) {
      colorKey = key;
      colorData.set(s.colors.flatMap(toRgb));
    }
    gl.uniform3fv(loc('uColors'), colorData);
    gl.uniform1f(loc('uHue'), state.hue);
    gl.uniform2f(loc('uPointer'), state.pointerX * dpr, state.pointerY * dpr);
    gl.uniform1f(loc('uHover'), state.hover);
    gl.uniform1f(loc('uScramble'), s.scramble);
    gl.uniform4fv(loc('uRipples'), rippleData);
    gl.uniform1f(loc('uIntro'), state.intro);
    gl.uniform1f(loc('uLight'), s.light ? 1 : 0);
    gl.uniform1f(loc('uReady'), state.ready ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const { pause, resume } = useRafFn(({ delta }) => frame(delta), {
    immediate: false,
  });

  function locate(event: PointerEvent): void {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.pointerX = x;
    state.pointerY = y;
    state.targetX = clamp((x / Math.max(1, rect.width)) * 2 - 1, -1, 1);
    state.targetY = clamp((y / Math.max(1, rect.height)) * 2 - 1, -1, 1);
  }

  function onPointerMove(event: PointerEvent): void {
    locate(event);
    state.inside = true;
  }

  function onPointerLeave(): void {
    state.inside = false;
  }

  function onPointerDown(event: PointerEvent): void {
    const s = settings.value;
    if (!s.interactive || !s.clickRipple) return;
    locate(event);
    state.ripples.push({ x: state.pointerX, y: state.pointerY, age: 0 });
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);
  useEventListener(containerRef, 'pointerdown', onPointerDown);
  useEventListener(containerRef, 'pointerleave', onPointerLeave);
  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (!program) return;
    if (state.visible) resume();
    else pause();
  });

  watch(
    [
      () => props.text,
      () => props.fontFamily,
      () => props.fontWeight,
      () => props.textColor,
      glyphs,
    ],
    rebuild,
  );

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    program = gl ? createProgram(gl) : null;
    if (!gl || !program) {
      fallback.value = true;
      return;
    }
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    textTexture = gl.createTexture();
    glyphTexture = gl.createTexture();
    for (const name of UNIFORM_NAMES) {
      uniforms.set(name, gl.getUniformLocation(program, name));
    }
    mounted = true;
    document.fonts.addEventListener('loadingdone', onFontsLoaded);
    resize();
    rebuild();
    if (state.visible) resume();
  });

  onBeforeUnmount(() => {
    mounted = false;
    pause();
    document.fonts.removeEventListener('loadingdone', onFontsLoaded);
    if (gl) {
      gl.deleteTexture(textTexture);
      gl.deleteTexture(glyphTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    program = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    role="img"
    :aria-label="props.text"
    :class="cn('absolute inset-0 touch-pan-y', props.class)"
  >
    <canvas ref="canvasRef" class="absolute inset-0 block size-full" />
    <div
      v-if="fallback"
      class="absolute inset-0 flex items-center justify-center"
      :style="{
        fontFamily: props.fontFamily,
        fontWeight: props.fontWeight,
        fontSize: `${8 * props.textScale}vw`,
        color: props.textColor,
      }"
    >
      {{ props.text }}
    </div>
  </div>
</template>
