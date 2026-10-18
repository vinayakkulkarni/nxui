<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    FALLOFF_CURVES,
    INTRO_SECONDS,
    clamp,
    hexToRgb,
    linkCursorGrid,
    resolveSettings,
  } from './cursor-grid-gl';
  import type {
    CursorGridProgram,
    CursorGridProps,
    CursorGridPulse,
  } from './types';

  const props = withDefaults(defineProps<CursorGridProps>(), {
    cellSize: 60,
    color: undefined,
    gridColor: undefined,
    radius: 140,
    falloff: 'smooth',
    highlight: 'area',
    holdTime: 400,
    fadeDuration: 800,
    lineWidth: 1,
    maxOpacity: 1,
    fillOpacity: 0.06,
    gridOpacity: 0.08,
    gridStyle: 'lines',
    cellRadius: 0,
    cellGap: 0,
    spotlight: 0.6,
    clickPulse: true,
    pulseSpeed: 600,
    ambient: 0,
    edgeFade: 0.2,
    intro: true,
    lightMode: false,
    dpr: undefined,
    class: '',
    style: undefined,
  });

  const settings = computed(() => resolveSettings(props));

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();

  let gl: WebGL2RenderingContext | null = null;
  let shader: CursorGridProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let stateTexture: WebGLTexture | null = null;
  let reduce = false;

  const view = { width: 1, height: 1, ratio: 1, cellSize: 0 };
  const grid = { cols: 0, rows: 0, offX: 0, offY: 0 };
  const pointer = { x: 0, y: 0, inside: false };
  const mouse = { x: 0, y: 0 };
  const pulses: CursorGridPulse[] = [];
  let levels = new Float32Array(0);
  let waves = new Float32Array(0);
  let targets = new Float32Array(0);
  let touched = new Float32Array(0);
  let pixels = new Uint8Array(0);
  let presence = 0;
  let clock = 0;
  let introClock = 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let dirty = true;

  function uniform(name: string): WebGLUniformLocation | null {
    return shader?.uniforms.get(name) ?? null;
  }

  function rebuild() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!gl || !container || !canvas) return;
    const s = settings.value;
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    const size = s.cellSize;
    const cols = Math.ceil(view.width / size) + 1;
    const rows = Math.ceil(view.height / size) + 1;
    const resized =
      cols !== grid.cols || rows !== grid.rows || size !== view.cellSize;
    grid.cols = cols;
    grid.rows = rows;
    grid.offX = (view.width - cols * size) / 2;
    grid.offY = (view.height - rows * size) / 2;
    view.cellSize = size;
    if (resized) {
      levels = new Float32Array(cols * rows);
      waves = new Float32Array(cols * rows);
      targets = new Float32Array(cols * rows);
      touched = new Float32Array(cols * rows).fill(-1e9);
      pixels = new Uint8Array(cols * rows);
      gl.bindTexture(gl.TEXTURE_2D, stateTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R8,
        cols,
        rows,
        0,
        gl.RED,
        gl.UNSIGNED_BYTE,
        pixels,
      );
    }
    dirty = true;
  }

  function light(index: number, value: number) {
    if (value > targets[index]!) targets[index] = value;
    touched[index] = clock;
  }

  function energize(x: number, y: number) {
    const s = settings.value;
    const size = s.cellSize;
    if (s.highlight === 'cell') {
      const col = Math.floor((x - grid.offX) / size);
      const row = Math.floor((y - grid.offY) / size);
      if (col >= 0 && row >= 0 && col < grid.cols && row < grid.rows)
        light(row * grid.cols + col, 1);
      return;
    }
    const r = s.radius;
    const ease = FALLOFF_CURVES[s.falloff] ?? FALLOFF_CURVES.linear;
    const minCol = Math.max(0, Math.floor((x - r - grid.offX) / size));
    const maxCol = Math.min(
      grid.cols - 1,
      Math.floor((x + r - grid.offX) / size),
    );
    const minRow = Math.max(0, Math.floor((y - r - grid.offY) / size));
    const maxRow = Math.min(
      grid.rows - 1,
      Math.floor((y + r - grid.offY) / size),
    );
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cx = grid.offX + col * size + size / 2;
        const cy = grid.offY + row * size + size / 2;
        const dist = Math.hypot(cx - x, cy - y);
        if (dist > r) continue;
        const value = ease(1 - dist / r);
        if (value > 0) light(row * grid.cols + col, value);
      }
    }
  }

  function sweepPulses() {
    const s = settings.value;
    const size = s.cellSize;
    const ahead = size * 0.6;
    const behind = size * 1.4;
    const far = Math.hypot(view.width, view.height);
    waves.fill(0);
    for (let k = pulses.length - 1; k >= 0; k--) {
      const pulse = pulses[k]!;
      const ringR = (clock - pulse.t0) * s.pulseSpeed;
      if (ringR - behind * 2 > far) {
        pulses.splice(k, 1);
        continue;
      }
      if (ringR < 0) continue;
      const envelope =
        pulse.strength * Math.pow(Math.max(0, 1 - ringR / (far + behind)), 0.6);
      const outer = ringR + ahead * 2;
      const minCol = Math.max(
        0,
        Math.floor((pulse.x - outer - grid.offX) / size),
      );
      const maxCol = Math.min(
        grid.cols - 1,
        Math.floor((pulse.x + outer - grid.offX) / size),
      );
      const minRow = Math.max(
        0,
        Math.floor((pulse.y - outer - grid.offY) / size),
      );
      const maxRow = Math.min(
        grid.rows - 1,
        Math.floor((pulse.y + outer - grid.offY) / size),
      );
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cx = grid.offX + col * size + size / 2;
          const cy = grid.offY + row * size + size / 2;
          const off = Math.hypot(cx - pulse.x, cy - pulse.y) - ringR;
          if (off > ahead * 2 || off < -behind * 2) continue;
          const t = off > 0 ? off / ahead : off / behind;
          const value = envelope * Math.exp(-t * t);
          const index = row * grid.cols + col;
          if (value > waves[index]!) waves[index] = value;
        }
      }
    }
    dirty = true;
  }

  function draw() {
    const canvas = canvasRef.value;
    if (!gl || !shader || !canvas) return;
    const s = settings.value;
    const ratio = view.ratio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateTexture);
    if (dirty) {
      for (let i = 0; i < levels.length; i++)
        pixels[i] = Math.round(
          clamp(Math.max(levels[i]!, waves[i]!), 0, 1) * 255,
        );
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        grid.cols,
        grid.rows,
        gl.RED,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      dirty = false;
    }
    const lineDevice = s.lineWidth * ratio;
    const snap = Math.round(lineDevice) % 2 === 1 ? 0.5 : 0;
    gl.uniform1i(uniform('uState'), 0);
    gl.uniform2f(uniform('uResolution'), canvas.width, canvas.height);
    gl.uniform2f(
      uniform('uOffset'),
      Math.round(grid.offX * ratio) + snap,
      Math.round(grid.offY * ratio) + snap,
    );
    gl.uniform1f(uniform('uCellSize'), s.cellSize * ratio);
    gl.uniform2i(uniform('uCells'), grid.cols, grid.rows);
    gl.uniform3fv(uniform('uColor'), hexToRgb(s.color));
    gl.uniform3fv(uniform('uGridColor'), hexToRgb(s.gridColor));
    gl.uniform1f(uniform('uLineWidth'), lineDevice);
    gl.uniform1f(uniform('uMaxOpacity'), s.maxOpacity);
    gl.uniform1f(uniform('uFillOpacity'), s.fillOpacity);
    gl.uniform1f(uniform('uGridOpacity'), s.gridOpacity);
    gl.uniform1f(uniform('uCellRadius'), s.cellRadius * ratio);
    gl.uniform1f(uniform('uCellGap'), s.cellGap * ratio);
    gl.uniform1i(uniform('uGridStyle'), s.gridStyle);
    gl.uniform2f(uniform('uMouse'), mouse.x * ratio, mouse.y * ratio);
    gl.uniform1f(uniform('uRadius'), s.radius * ratio);
    gl.uniform1f(uniform('uSpotlight'), s.spotlight);
    gl.uniform1f(uniform('uPresence'), presence);
    gl.uniform1f(uniform('uEdgeFade'), s.edgeFade);
    gl.uniform1f(
      uniform('uReveal'),
      introClock >= 1 ? 1 : 1 - Math.pow(1 - introClock, 2.2),
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || documentVisibility.value === 'hidden') return;
    const s = settings.value;
    const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
    last = now;
    clock += dt;
    if (introClock < 1)
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);

    const follow = 1 - Math.exp(-dt / 0.07);
    mouse.x += (pointer.x - mouse.x) * follow;
    mouse.y += (pointer.y - mouse.y) * follow;
    const presenceGoal = pointer.inside ? 1 : 0;
    presence += (presenceGoal - presence) * (1 - Math.exp(-dt / 0.25));

    if (s.ambient > 0 && !reduce && levels.length) {
      const chance = s.ambient * dt * levels.length * 0.04;
      let spawns = Math.floor(chance) + (Math.random() < chance % 1 ? 1 : 0);
      while (spawns-- > 0)
        light(
          Math.floor(Math.random() * levels.length),
          0.25 + Math.random() * 0.45,
        );
    }
    if (pulses.length) sweepPulses();
    else if (waves.length && waves.some((value) => value > 0)) {
      waves.fill(0);
      dirty = true;
    }

    const holdSeconds = s.holdTime / 1000;
    const fadeStep = dt / (s.fadeDuration / 1000);
    const attack = 1 - Math.exp(-dt / 0.045);
    let active =
      pulses.length > 0 ||
      introClock < 1 ||
      Math.abs(presence - presenceGoal) > 0.002;
    for (let i = 0; i < levels.length; i++) {
      let target = targets[i]!;
      const before = levels[i]!;
      if (target <= 0 && before <= 0) continue;
      if (clock - touched[i]! > holdSeconds)
        target = Math.max(0, target - fadeStep);
      targets[i] = target;
      const next =
        target > before ? before + (target - before) * attack : target;
      const settled = next < 0.002 ? 0 : next;
      levels[i] = settled;
      if (settled !== before) dirty = true;
      if (settled > 0 || target > 0) active = true;
    }
    if (
      Math.abs(mouse.x - pointer.x) + Math.abs(mouse.y - pointer.y) > 0.05 &&
      presence > 0.002
    )
      active = true;
    if (s.ambient > 0 && !reduce) active = true;

    draw();
    if (active) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!gl || raf || !visible || documentVisibility.value === 'hidden') return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function locate(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return { x: 0, y: 0, inside: false };
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  function onPointerMove(event: PointerEvent) {
    if (!gl) return;
    const { x, y, inside } = locate(event);
    const was = pointer.inside;
    pointer.inside = inside;
    if (!inside) {
      if (was) wake();
      return;
    }
    pointer.x = x;
    pointer.y = y;
    if (!was) {
      mouse.x = x;
      mouse.y = y;
    }
    energize(x, y);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    if (!gl) return;
    const { x, y, inside } = locate(event);
    if (!inside || !settings.value.clickPulse || reduce) return;
    pulses.push({ x, y, t0: clock, strength: 1 });
    wake();
  }

  function onPointerLeave() {
    pointer.inside = false;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });

  useResizeObserver(containerRef, () => {
    rebuild();
    draw();
    wake();
  });

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });

  watch(documentVisibility, () => wake());

  watch(settings, (s) => {
    if (!gl) return;
    if (s.cellSize !== view.cellSize) rebuild();
    dirty = true;
    draw();
    wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas || !containerRef.value) return;
    const context = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!context) return;
    const linked = linkCursorGrid(context);
    if (!linked) return;
    gl = context;
    shader = linked;
    vao = gl.createVertexArray();
    stateTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, stateTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    reduce = reducedMotion.value === 'reduce';
    introClock = settings.value.intro && !reduce ? 0 : 1;
    useEventListener(document.documentElement, 'pointerleave', onPointerLeave);
    rebuild();
    if (introClock < 1)
      pulses.push({
        x: view.width / 2,
        y: view.height / 2,
        t0: 0.15,
        strength: 0.6,
      });
    draw();
    wake();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (gl) {
      gl.deleteTexture(stateTexture);
      gl.deleteVertexArray(vao);
      if (shader) gl.deleteProgram(shader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    shader = null;
    vao = null;
    stateTexture = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="props.style"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 block size-full"
      aria-hidden="true"
    />
    <div v-if="$slots.default" class="relative size-full">
      <slot />
    </div>
  </div>
</template>
