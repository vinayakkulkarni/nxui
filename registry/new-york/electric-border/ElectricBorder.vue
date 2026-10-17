<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    ARCS,
    MARGIN,
    PIXEL_BUDGET,
    PULSES,
    clamp,
    nearestOn,
    parseColor,
    pathOf,
    pointOn,
  } from './electric-border-path';
  import { FRAGMENT, VERTEX } from './electric-border-shaders';
  import type {
    ElectricBorderProps,
    ElectricBorderPulse,
    ElectricBorderSpark,
  } from './types';

  const props = withDefaults(defineProps<ElectricBorderProps>(), {
    color: '#7df9ff',
    glowColor: undefined,
    speed: 1,
    chaos: 0.5,
    spread: 0.6,
    thickness: 1.5,
    strands: 3,
    glow: 0.6,
    intensity: 0.8,
    arcs: 1,
    flicker: 0.5,
    borderRadius: 24,
    offset: 0,
    active: true,
    intro: true,
    interactive: true,
    cursorRadius: 90,
    theme: 'dark',
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();

  const base = computed(() => parseColor(props.color));
  const core = computed(() =>
    base.value.map((channel) => channel + (1 - channel) * 0.55),
  );
  const glowRgb = computed(() =>
    props.glowColor ? parseColor(props.glowColor) : base.value,
  );

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  const arcEnds = new Float32Array(ARCS * 4);
  const arcShape = new Float32Array(ARCS * 4);
  const pulseData = new Float32Array(PULSES * 4);
  const size = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, over: false, near: false };
  const hover = { x: 0, y: 0, vx: 0, vy: 0, power: 0 };
  const sparks: ElectricBorderSpark[] = [];
  const pulses: ElectricBorderPulse[] = [];
  let reduced = false;
  let power = 0;
  let reveal = 0;
  let wasActive = true;
  let ink = 0;
  let path = pathOf(1, 1, 0, 0);
  let time = 0;
  let last = 0;
  let visible = true;
  let lost = true;

  function u(name: string): WebGLUniformLocation | null {
    return uniforms[name] ?? null;
  }

  function compile(
    context: WebGL2RenderingContext,
    type: number,
    source: string,
  ) {
    const shader = context.createShader(type);
    if (!shader) return null;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      console.error(context.getShaderInfoLog(shader));
      context.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function link(context: WebGL2RenderingContext) {
    const vertex = compile(context, context.VERTEX_SHADER, VERTEX);
    const fragment = compile(context, context.FRAGMENT_SHADER, FRAGMENT);
    const linked = vertex && fragment ? context.createProgram() : null;
    if (!vertex || !fragment || !linked) {
      if (vertex) context.deleteShader(vertex);
      if (fragment) context.deleteShader(fragment);
      return false;
    }
    context.attachShader(linked, vertex);
    context.attachShader(linked, fragment);
    context.linkProgram(linked);
    context.deleteShader(vertex);
    context.deleteShader(fragment);
    if (!context.getProgramParameter(linked, context.LINK_STATUS)) {
      console.error(context.getProgramInfoLog(linked));
      context.deleteProgram(linked);
      return false;
    }
    const found: Record<string, WebGLUniformLocation | null> = {};
    const count: number = context.getProgramParameter(
      linked,
      context.ACTIVE_UNIFORMS,
    );
    for (let index = 0; index < count; index++) {
      const info = context.getActiveUniform(linked, index);
      if (info)
        found[info.name.replace(/\[0\]$/, '')] = context.getUniformLocation(
          linked,
          info.name,
        );
    }
    program = linked;
    uniforms = found;
    return true;
  }

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const width = Math.max(1, container.offsetWidth);
    const height = Math.max(1, container.offsetHeight);
    const canvasWidth = width + MARGIN * 2;
    const canvasHeight = height + MARGIN * 2;
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(PIXEL_BUDGET / (canvasWidth * canvasHeight)),
    );
    const pixelWidth = Math.max(1, Math.round(canvasWidth * ratio));
    const pixelHeight = Math.max(1, Math.round(canvasHeight * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    size.width = width;
    size.height = height;
    size.ratio = pixelWidth / canvasWidth;
    path = pathOf(width, height, Math.max(0, props.borderRadius), props.offset);
  }

  function spawnArc(now: number, near: number | null): ElectricBorderSpark {
    const span = Math.min(path.perimeter * 0.3, 60 + Math.random() * 90);
    const start = near ?? Math.random() * path.perimeter;
    const from = start - span * (0.2 + Math.random() * 0.6);
    const to = from + span;
    const a = pointOn(path, from);
    const b = pointOn(path, to);
    const mid = pointOn(path, (from + to) / 2);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const side = (-dy / length) * mid.nx + (dx / length) * mid.ny;
    const bow = Math.min(
      MARGIN - 30,
      length * (0.14 + Math.random() * 0.16) + 5,
    );
    return {
      ax: a.x,
      ay: a.y,
      bx: b.x,
      by: b.y,
      bow: side >= 0 ? bow : -bow,
      seed: 1 + Math.random() * 60,
      born: now,
      life: 0.35 + Math.random() * 0.45,
    };
  }

  function render(heatPower: number) {
    const canvas = canvasRef.value;
    if (!gl || !program || !canvas) return;
    const width = size.width + MARGIN * 2;
    const height = size.height + MARGIN * 2;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (power <= 0.001 && !sparks.length) return;
    gl.useProgram(program);
    gl.uniform2f(u('uSize'), width, height);
    gl.uniform1f(u('uRatio'), size.ratio);
    gl.uniform2f(u('uCenter'), width / 2, height / 2);
    gl.uniform2f(u('uHalf'), path.hx, path.hy);
    gl.uniform1f(u('uRadius'), path.r);
    gl.uniform3f(u('uParam'), path.ax, path.ay, path.vr);
    gl.uniform1f(u('uPerimeter'), path.perimeter);
    gl.uniform4f(
      u('uCells'),
      Math.max(1, Math.round(path.perimeter / 75)),
      Math.max(2, Math.round(path.perimeter / 25)),
      Math.max(3, Math.round(path.perimeter / 9)),
      Math.max(4, Math.round(path.perimeter / 4)),
    );
    gl.uniform2f(
      u('uSoft'),
      Math.max(1, Math.round(path.perimeter / 150)),
      Math.max(1, Math.round(path.perimeter / 50)),
    );
    gl.uniform1f(u('uTime'), time);
    gl.uniform1f(u('uPower'), power * power * (3 - 2 * power));
    gl.uniform1f(u('uReveal'), reveal);
    gl.uniform3f(u('uHover'), hover.x + MARGIN, hover.y + MARGIN, heatPower);
    gl.uniform1f(u('uHoverRadius'), Math.max(1, props.cursorRadius));
    gl.uniform4fv(u('uPulses'), pulseData);
    gl.uniform3fv(u('uCore'), core.value);
    gl.uniform3fv(u('uGlowColor'), glowRgb.value);
    gl.uniform1f(u('uIntensity'), Math.max(0, props.intensity));
    gl.uniform1f(u('uGlow'), clamp(props.glow, 0, 3));
    gl.uniform1f(u('uThickness'), Math.max(0.25, props.thickness));
    gl.uniform1f(u('uStrands'), clamp(Math.round(props.strands), 1, 6));
    gl.uniform1f(u('uChaos'), clamp(props.chaos, 0, 2));
    gl.uniform1f(u('uSpread'), clamp(props.spread, 0, 2));
    gl.uniform1f(u('uFlicker'), reduced ? 0 : clamp(props.flicker, 0, 1));
    gl.uniform1f(u('uInk'), ink);
    gl.uniform4fv(u('uArcEnds'), arcEnds);
    gl.uniform4fv(u('uArcShape'), arcShape);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    if (lost) {
      pause();
      return;
    }
    const speed = Math.max(0, props.speed);
    const arcRate = Math.max(0, props.arcs);
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt * speed * (reduced ? 0.2 : 1);

    if (props.active && !wasActive) reveal = 0;
    wasActive = props.active;
    power +=
      ((props.active ? 1 : 0) - power) *
      (1 - Math.exp(-dt / (props.active ? 0.28 : 0.4)));
    if (props.active) reveal = reduced ? 1 : Math.min(1, reveal + dt / 0.9);
    const light = props.theme === 'light';
    ink += ((light ? 1 : 0) - ink) * (1 - Math.exp(-dt / 0.25));

    const engaged = props.interactive && pointer.near && props.active;
    if (engaged && hover.power < 0.01) {
      hover.x = pointer.x;
      hover.y = pointer.y;
      hover.vx = 0;
      hover.vy = 0;
    }
    hover.vx += ((pointer.x - hover.x) * 120 - hover.vx * 19) * dt;
    hover.vy += ((pointer.y - hover.y) * 120 - hover.vy * 19) * dt;
    hover.x += hover.vx * dt;
    hover.y += hover.vy * dt;
    hover.power +=
      ((engaged ? 1 : 0) - hover.power) *
      (1 - Math.exp(-dt / (engaged ? 0.3 : 0.55)));

    for (let index = sparks.length - 1; index >= 0; index--) {
      const spark = sparks[index];
      if (spark && time - spark.born > spark.life) sparks.splice(index, 1);
    }
    if (
      !reduced &&
      props.active &&
      reveal >= 1 &&
      arcRate > 0 &&
      sparks.length < ARCS
    ) {
      const chance = dt * speed * arcRate;
      if (Math.random() < chance * 5 * hover.power) {
        sparks.push(
          spawnArc(
            time,
            nearestOn(
              path,
              hover.x - size.width / 2,
              hover.y - size.height / 2,
            ),
          ),
        );
      } else if (Math.random() < chance * (0.6 + path.perimeter / 2400)) {
        sparks.push(spawnArc(time, null));
      }
    }
    const fit = power * power * (3 - 2 * power);
    for (let index = 0; index < ARCS; index++) {
      const o = index * 4;
      const spark = sparks[index];
      if (!spark) {
        arcShape[o + 1] = 0;
        continue;
      }
      const k = clamp((time - spark.born) / spark.life, 0, 1);
      arcEnds[o] = spark.ax + size.width / 2 + MARGIN;
      arcEnds[o + 1] = spark.ay + size.height / 2 + MARGIN;
      arcEnds[o + 2] = spark.bx + size.width / 2 + MARGIN;
      arcEnds[o + 3] = spark.by + size.height / 2 + MARGIN;
      arcShape[o] = spark.bow;
      arcShape[o + 1] = Math.sin(Math.PI * k) * fit;
      arcShape[o + 2] = spark.seed;
    }

    for (let index = pulses.length - 1; index >= 0; index--) {
      const pulse = pulses[index];
      if (pulse && now - pulse.born > 2200) pulses.splice(index, 1);
    }
    for (let index = 0; index < PULSES; index++) {
      const o = index * 4;
      const pulse = pulses[index];
      if (!pulse) {
        pulseData[o + 2] = 0;
        continue;
      }
      pulseData[o] = pulse.s;
      pulseData[o + 1] = (now - pulse.born) / 1000;
      pulseData[o + 2] = 1;
    }

    render(hover.power * (props.interactive ? 1 : 0));

    const busy = power > 0.002 || props.active || sparks.length > 0;
    if (!busy || !visible || pageVisibility.value === 'hidden') pause();
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => frame(timestamp),
    {
      immediate: false,
    },
  );

  function wake() {
    if (isActive.value || lost || !visible || pageVisibility.value === 'hidden')
      return;
    last = performance.now();
    resume();
  }

  function locate(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.over =
      pointer.x >= 0 &&
      pointer.y >= 0 &&
      pointer.x <= rect.width &&
      pointer.y <= rect.height;
    pointer.near =
      pointer.x >= -MARGIN / 2 &&
      pointer.y >= -MARGIN / 2 &&
      pointer.x <= rect.width + MARGIN / 2 &&
      pointer.y <= rect.height + MARGIN / 2;
  }

  function onPointerMove(event: PointerEvent) {
    locate(event);
    if (pointer.near) wake();
  }

  function onPointerDown(event: PointerEvent) {
    locate(event);
    if (!pointer.over || !props.interactive || !props.active || reduced) return;
    const along = nearestOn(
      path,
      pointer.x - size.width / 2,
      pointer.y - size.height / 2,
    );
    pulses.push({ s: along, born: performance.now() });
    if (pulses.length > PULSES) pulses.shift();
    if (sparks.length < ARCS) sparks.push(spawnArc(time, along));
    wake();
  }

  function onLeave() {
    pointer.over = false;
    pointer.near = false;
  }

  function teardown() {
    pause();
    if (gl && !gl.isContextLost()) {
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    }
    vao = null;
    program = null;
  }

  function setup(restored: boolean) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const context = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default',
    });
    if (!context || !link(context)) return;
    gl = context;
    vao = context.createVertexArray();
    reduced = reducedMotion.value === 'reduce';
    power = props.active && !(props.intro && !reduced && !restored) ? 1 : 0;
    reveal = power;
    wasActive = props.active;
    ink = props.theme === 'light' ? 1 : 0;
    time = Math.random() * 100;
    sparks.length = 0;
    pulses.length = 0;
    lost = false;
    resize();
    wake();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    pause();
  }

  function onContextRestored() {
    teardown();
    setup(true);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener(rootRef, 'pointerleave', onLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(containerRef, () => {
    resize();
    wake();
  });

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    wake();
  });

  watch(pageVisibility, wake);

  watch(props, () => {
    if (lost) return;
    resize();
    wake();
  });

  onMounted(() => {
    rootRef.value = document.documentElement;
    setup(false);
  });

  onBeforeUnmount(() => {
    lost = true;
    teardown();
    gl = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative isolate', props.class)"
    :style="{ borderRadius: `${props.borderRadius}px` }"
  >
    <slot />
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute -top-16 -left-16 z-1 block"
      aria-hidden="true"
    />
  </div>
</template>
