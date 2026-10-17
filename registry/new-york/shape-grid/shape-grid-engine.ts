import {
  DIRECTIONS,
  MAX_PIXELS,
  centerOf,
  flatView,
  hash,
  keyOf,
  layoutFor,
  project,
  smoothstep,
  smootherstep,
  tint,
  traceCell,
  viewFor,
} from './shape-grid-math';
import type {
  ShapeGridCascade,
  ShapeGridEngine,
  ShapeGridEngineOptions,
  ShapeGridLayout,
  ShapeGridSettings,
} from './types';

const NOOP_ENGINE: ShapeGridEngine = {
  redraw: () => {},
  setVisible: () => {},
  pointerMove: () => {},
  pointerDown: () => {},
  leave: () => {},
  dispose: () => {},
};

export function createShapeGridEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  options: ShapeGridEngineOptions,
): ShapeGridEngine {
  const ctx = canvas.getContext('2d');
  if (!ctx) return NOOP_ENGINE;
  const reduce = options.reducedMotion;

  const state = {
    alive: true,
    raf: 0,
    last: 0,
    time: 0,
    visible: true,
    width: 1,
    height: 1,
    ratio: 1,
    view: flatView(1, 1),
    offsetX: 0,
    offsetY: 0,
    started: false,
    startedAt: 0,
    inside: false,
    pointerX: 0,
    pointerY: 0,
    spotX: 0,
    spotY: 0,
    spotVX: 0,
    spotVY: 0,
    spotPower: 0,
    lit: new Map<number, number>(),
    hues: new Map<number, number>(),
    cascadeHue: 0,
  };
  let cascades: ShapeGridCascade[] = [];

  function resize() {
    const s = options.getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const view = viewFor(s.tiltX, s.tiltY, width, height, s.cellSize);
    let ratio = s.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
    const pixels = view.width * view.height * ratio * ratio;
    if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
    state.width = width;
    state.height = height;
    state.ratio = ratio;
    state.view = view;
    const pixelWidth = Math.max(1, Math.round(view.width * ratio));
    const pixelHeight = Math.max(1, Math.round(view.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const cssWidth = `${view.width}px`;
    const cssHeight = `${view.height}px`;
    if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth;
    if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight;
    if (canvas.style.transform !== view.transform) {
      canvas.style.transform = view.transform;
    }
  }

  function toPlane(x: number, y: number): [number, number] | null {
    const { inverse, far } = state.view;
    if (!inverse) return [x, y];
    if (inverse[6] * x + inverse[7] * y + inverse[8] < 1 / far) return null;
    return project(inverse, x, y);
  }

  function range(
    layout: ShapeGridLayout,
    margin: number,
  ): [number, number, number, number] {
    const { stepX, stepY } = layout;
    const { view } = state;
    return [
      Math.floor((state.offsetX + view.x0 - margin) / stepX) - 1,
      Math.ceil((state.offsetX + view.x0 + view.width + margin) / stepX) + 1,
      Math.floor((state.offsetY + view.y0 - margin) / stepY) - 1,
      Math.ceil((state.offsetY + view.y0 + view.height + margin) / stepY) + 1,
    ];
  }

  function nearestCell(
    s: ShapeGridSettings,
    layout: ShapeGridLayout,
    wx: number,
    wy: number,
  ): [number, number] {
    const ci = Math.round(wx / layout.stepX);
    const cj = Math.round(wy / layout.stepY);
    let best = Infinity;
    let cell: [number, number] = [ci, cj];
    for (let i = ci - 2; i <= ci + 2; i++) {
      for (let j = cj - 2; j <= cj + 2; j++) {
        const [x, y] = centerOf(s.shape, layout, i, j);
        const d = (x - wx) ** 2 + (y - wy) ** 2;
        if (d < best) {
          best = d;
          cell = [i, j];
        }
      }
    }
    return cell;
  }

  function illuminate(
    s: ShapeGridSettings,
    layout: ShapeGridLayout,
    dt: number,
  ) {
    const decay = Math.exp(-dt / s.trail);
    for (const [key, value] of state.lit) {
      const next = value * decay;
      if (next < 0.004) {
        state.lit.delete(key);
        state.hues.delete(key);
      } else state.lit.set(key, next);
    }
    if (state.spotPower < 0.01) return;
    const wx = state.spotX + state.offsetX;
    const wy = state.spotY + state.offsetY;
    const reach = Math.max(s.radius, 0.5) * s.cellSize;
    const [hi, hj] = nearestCell(s, layout, wx, wy);
    const spanI = Math.ceil(reach / layout.stepX) + 2;
    const spanJ = Math.ceil(reach / layout.stepY) + 2;
    const hue = state.time * 120;
    for (let i = hi - spanI; i <= hi + spanI; i++) {
      for (let j = hj - spanJ; j <= hj + spanJ; j++) {
        const [x, y] = centerOf(s.shape, layout, i, j);
        const distance = Math.hypot(x - wx, y - wy);
        let value =
          s.radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
        if (i === hi && j === hj) value = Math.max(value, 1);
        value *= state.spotPower;
        if (value <= 0.004) continue;
        const key = keyOf(i, j);
        if (value > (state.lit.get(key) ?? 0)) {
          state.lit.set(key, value);
          state.hues.set(key, hue + ((x + y) / s.cellSize) * 12);
        }
      }
    }
  }

  function cascadeAt(s: ShapeGridSettings, x: number, y: number): number {
    let value = 0;
    for (const cascade of cascades) {
      const ring = Math.round(
        Math.hypot(x - cascade.x, y - cascade.y) / s.cellSize,
      );
      const local = state.time - cascade.time - ring * 0.055;
      if (local < 0) continue;
      const pulse =
        Math.exp(-((local / 0.085) ** 2)) *
        cascade.power *
        Math.max(0, 1 - ring / cascade.reach);
      if (pulse > value) {
        value = pulse;
        state.cascadeHue = cascade.hue + ring * 16;
      }
    }
    return value;
  }

  function draw() {
    if (!ctx) return;
    const s = options.getSettings();
    const { view, ratio } = state;
    const layout = layoutFor(s.shape, s.cellSize);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, -view.x0 * ratio, -view.y0 * ratio);

    const left = view.x0;
    const top = view.y0;
    const right = view.x0 + view.width;
    const bottom = view.y0 + view.height;
    const size = s.cellSize;
    const [i0, i1, j0, j1] = range(layout, size);
    const markers = s.shape === 'cross' || s.shape === 'dot';
    const elapsed = state.time - state.startedAt;
    const introRadius =
      s.intro && !reduce ? elapsed * view.reach * 1.8 : Infinity;
    const originX = state.width / 2;
    const originY = state.height / 2;
    const centerX = originX + state.offsetX;
    const centerY = originY + state.offsetY;

    ctx.lineWidth = s.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = s.lineColor;
    ctx.fillStyle = s.lineColor;
    ctx.beginPath();
    if (s.shape === 'square') {
      for (let i = i0; i <= i1; i++) {
        const x = i * layout.stepX - state.offsetX;
        ctx.moveTo(x, top - size);
        ctx.lineTo(x, bottom + size);
      }
      for (let j = j0; j <= j1; j++) {
        const y = j * layout.stepY - state.offsetY;
        ctx.moveTo(left - size, y);
        ctx.lineTo(right + size, y);
      }
    } else {
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const [cx, cy] = centerOf(s.shape, layout, i, j);
          traceCell(
            ctx,
            s.shape,
            layout,
            size,
            [i, j],
            cx - state.offsetX,
            cy - state.offsetY,
            0,
          );
        }
      }
    }
    if (s.shape === 'dot') ctx.fill();
    else ctx.stroke();

    if (introRadius !== Infinity) {
      const gradient = ctx.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        Math.max(1, introRadius),
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.82, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    const glowing = s.glow > 0;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const [cx, cy] = centerOf(s.shape, layout, i, j);
        const key = keyOf(i, j);
        let value = state.lit.get(key) ?? 0;
        let hue = state.hues.get(key) ?? 0;
        if (cascades.length) {
          const pulse = cascadeAt(s, cx, cy);
          if (pulse > value) {
            value = pulse;
            hue = state.cascadeHue;
          }
        }
        if (s.twinkle > 0 && !reduce) {
          const seed = hash(i, j);
          const wave = Math.sin(state.time * (0.35 + seed * 0.5) + seed * 40);
          const sparkle = s.twinkle * 0.7 * Math.max(0, wave) ** 18;
          if (sparkle > value) {
            value = sparkle;
            hue = seed * 360;
          }
        }
        if (introRadius !== Infinity) {
          const front = introRadius - Math.hypot(cx - centerX, cy - centerY);
          if (front < 0) continue;
          const wave = Math.exp(-((front / (size * 1.4)) ** 2)) * 0.85;
          if (wave > value) {
            value = wave;
            hue =
              (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI +
              state.time * 120;
          }
        }
        if (value <= 0.01) continue;
        const color = s.rainbow ? tint(hue, s.tone) : s.hoverColor;
        const x = cx - state.offsetX;
        const y = cy - state.offsetY;
        ctx.beginPath();
        traceCell(
          ctx,
          s.shape,
          layout,
          size,
          [i, j],
          x,
          y,
          markers ? value * size * 0.08 : s.lineWidth * 0.5,
        );
        if (markers) {
          ctx.globalAlpha = Math.min(1, value);
          if (glowing) {
            ctx.shadowColor = color;
            ctx.shadowBlur = s.glow * 14 * value;
          }
          if (s.shape === 'dot') {
            ctx.fillStyle = color;
            ctx.fill();
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = s.lineWidth * (1 + value * 0.6);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          continue;
        }
        if (s.fillOpacity > 0) {
          ctx.globalAlpha = Math.min(1, value) * s.fillOpacity;
          ctx.fillStyle = s.rainbow ? color : s.hoverFillColor;
          ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, value) * 0.85;
        if (glowing) {
          ctx.shadowColor = color;
          ctx.shadowBlur = s.glow * 16 * value;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = s.lineWidth;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;

    if (view.mist) {
      const [mx0, my0, mx1, my1] = view.mist;
      const gradient = ctx.createLinearGradient(mx0, my0, mx1, my1);
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        gradient.addColorStop(
          t,
          `rgba(0, 0, 0, ${(1 - smootherstep(t)).toFixed(3)})`,
        );
      }
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function frame(now: number) {
    state.raf = 0;
    if (!state.alive) return;
    const s = options.getSettings();
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    resize();
    if (!state.started) {
      state.started = true;
      state.startedAt = state.time;
    }
    if (!s.paused) {
      state.time += dt;
      if (!reduce) {
        const [dx, dy] = DIRECTIONS[s.direction];
        state.offsetX -= dx * s.speed * 60 * dt;
        state.offsetY -= dy * s.speed * 60 * dt;
      }
      const want = state.inside ? 1 : 0;
      state.spotPower +=
        (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
      const stiffness = 220;
      const damping = 2 * Math.sqrt(stiffness) * 0.85;
      state.spotVX +=
        (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) *
        dt;
      state.spotVY +=
        (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) *
        dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;
      illuminate(s, layoutFor(s.shape, s.cellSize), dt);
      cascades = cascades.filter(
        (cascade) => state.time - cascade.time < cascade.reach * 0.055 + 0.4,
      );
    }
    draw();
    const still = s.speed === 0 || s.direction === 'none' || reduce;
    const settled =
      s.paused ||
      (still &&
        state.lit.size === 0 &&
        cascades.length === 0 &&
        s.twinkle === 0 &&
        state.spotPower < 0.005 &&
        state.time - state.startedAt > 3);
    if (!settled && state.visible) state.raf = requestAnimationFrame(frame);
    else state.last = 0;
  }

  function wake() {
    if (!state.raf && state.alive && state.visible) {
      state.raf = requestAnimationFrame(frame);
    }
  }

  function pointFrom(event: PointerEvent): [number, number] | null {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return toPlane(x, y);
  }

  function pointerMove(event: PointerEvent) {
    const point = pointFrom(event);
    if (point && !state.inside && state.spotPower < 0.02) {
      state.spotX = point[0];
      state.spotY = point[1];
      state.spotVX = 0;
      state.spotVY = 0;
    }
    state.inside = point !== null;
    if (point) {
      state.pointerX = point[0];
      state.pointerY = point[1];
      wake();
    }
  }

  function pointerDown(event: PointerEvent) {
    const s = options.getSettings();
    if (!s.clickCascade) return;
    const point = pointFrom(event);
    if (!point) return;
    cascades.push({
      x: point[0] + state.offsetX,
      y: point[1] + state.offsetY,
      time: state.time,
      power: 1,
      reach: Math.hypot(state.view.width, state.view.height) / s.cellSize,
      hue: state.time * 120,
    });
    if (cascades.length > 6) cascades.shift();
    wake();
  }

  function leave() {
    state.inside = false;
  }

  function redraw() {
    resize();
    draw();
    wake();
  }

  resize();
  wake();

  return {
    redraw,
    setVisible(visible: boolean) {
      state.visible = visible;
      if (visible) wake();
    },
    pointerMove,
    pointerDown,
    leave,
    dispose() {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    },
  };
}
