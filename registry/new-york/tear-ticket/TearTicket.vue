<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { useSpring } from 'motion-v';
  import type { ComponentPublicInstance, CSSProperties } from 'vue';
  import type { TearTicketProps } from './types';
  import {
    ART_INSET,
    ART_SPAN,
    GRAVITY,
    RETRACT,
    buildGeometry,
    clamp,
    createSim,
    f,
    rad,
    wrap,
  } from './tear-ticket-geometry';

  const props = withDefaults(defineProps<TearTicketProps>(), {
    image: '',
    imageAlt: '',
    scrim: true,
    imageRadius: 8,
    orientation: 'horizontal',
    torn: undefined,
    defaultTorn: false,
    width: 460,
    height: 250,
    stubSize: 150,
    radius: 16,
    holes: 12,
    holeSize: 6,
    notch: 3,
    roughness: 0,
    tearAngle: 30,
    stretch: 30,
    resistance: 0.45,
    rotate: 4,
    tilt: true,
    tiltMax: 9,
    tiltReach: 260,
    parallax: 6,
    perspective: 1000,
    background: '#27272a',
    color: '#f5f5f5',
    border: true,
    borderColor: '',
    borderWidth: 1,
    stubBackground: '',
    recenter: true,
    disabled: false,
    ariaLabel: 'Tear off the stub',
    class: '',
  });

  const emit = defineEmits<{
    tear: [];
    'update:torn': [value: boolean];
  }>();

  const TILT_SPRING = { stiffness: 220, damping: 24, mass: 0.6 };

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');
  const controlled = computed(() => props.torn !== undefined);
  const inner = ref(props.defaultTorn);
  const used = computed(() =>
    controlled.value ? Boolean(props.torn) : inner.value,
  );
  const grabbing = ref(false);
  const instant = ref(used.value);
  const fit = ref(1);

  const rootRef = ref<HTMLDivElement | null>(null);
  const stageRef = ref<HTMLDivElement | null>(null);
  const planeRef = ref<HTMLDivElement | null>(null);
  const bodyRef = ref<HTMLDivElement | null>(null);
  const stubRef = ref<HTMLDivElement | null>(null);
  const imageRef = ref<HTMLImageElement | null>(null);
  const contentRef = ref<HTMLDivElement | null>(null);
  const fibres: (SVGPathElement | null)[] = [];

  const vertical = computed(() => props.orientation === 'vertical');
  const geo = computed(() =>
    buildGeometry(
      props.width,
      props.height,
      props.stubSize,
      props.radius,
      props.holes,
      props.holeSize,
      props.notch,
      props.roughness,
      vertical.value,
    ),
  );

  const sim = createSim();

  // ---- 3D tilt + parallax -------------------------------------------------
  const tiltX = useSpring(0, TILT_SPRING);
  const tiltY = useSpring(0, TILT_SPRING);

  function planeTransform(): string {
    return `perspective(${props.perspective}px) rotate(${props.rotate}deg) rotateX(${tiltX.get()}deg) rotateY(${tiltY.get()}deg)`;
  }

  function applyTilt() {
    if (planeRef.value) planeRef.value.style.transform = planeTransform();
    const depth = props.tiltMax > 0 ? props.parallax / props.tiltMax : 0;
    const tx = tiltX.get();
    const ty = tiltY.get();
    if (imageRef.value) {
      imageRef.value.style.transform = reduce.value
        ? ''
        : `translate(${-ty * depth}px, ${tx * depth}px)`;
    }
    if (contentRef.value) {
      contentRef.value.style.transform = reduce.value
        ? ''
        : `translate(${ty * depth * 0.22}px, ${-tx * depth * 0.22}px)`;
    }
  }

  const planeStyle = computed<CSSProperties>(() => ({
    transform: `perspective(${props.perspective}px) rotate(${props.rotate}deg) rotateX(0deg) rotateY(0deg)`,
  }));

  const unsubX = tiltX.on('change', applyTilt);
  const unsubY = tiltY.on('change', applyTilt);
  watch(
    [
      () => props.perspective,
      () => props.rotate,
      () => props.parallax,
      () => props.tiltMax,
      reduce,
    ],
    () => applyTilt(),
    { flush: 'post' },
  );

  useEventListener('pointermove', (e: PointerEvent) => {
    if (!props.tilt || reduce.value || props.disabled) return;
    const el = rootRef.value;
    if (!el || e.pointerType === 'touch' || sim.id !== null) return;
    const r = el.getBoundingClientRect();
    const nx = clamp(
      (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + props.tiltReach),
      -1,
      1,
    );
    const ny = clamp(
      (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + props.tiltReach),
      -1,
      1,
    );
    tiltY.set(nx * props.tiltMax);
    tiltX.set(-ny * props.tiltMax);
  });

  watch([() => props.tilt, () => props.disabled, reduce], () => {
    if (!props.tilt || props.disabled || reduce.value) {
      tiltX.set(0);
      tiltY.set(0);
    }
  });

  useResizeObserver(rootRef, () => {
    const el = rootRef.value;
    if (!el) return;
    fit.value = Math.min(1, el.clientWidth / props.width) || 1;
  });

  // ---- tear simulation ----------------------------------------------------
  function setFibre(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    fibres[index] = el instanceof SVGPathElement ? el : null;
  }

  function paint(now: number): boolean {
    const s = sim;
    const g = geo.value;
    const stubEl = stubRef.value;
    const bodyEl = bodyRef.value;
    if (stubEl) {
      stubEl.style.transform = `translate(${s.sx.toFixed(2)}px, ${s.sy.toFixed(2)}px) rotate(${((s.theta * s.sign * 180) / Math.PI).toFixed(3)}deg)`;
      stubEl.style.opacity = s.fade.toFixed(3);
    }
    const up = g.vertical;
    if (bodyEl)
      bodyEl.style.transform = `translate${up ? 'Y' : 'X'}(${s.bx.toFixed(2)}px)`;
    const cos = Math.cos(s.theta * s.sign);
    const sin = Math.sin(s.theta * s.sign);
    const lx = up ? 1.6 : 0;
    const ly = up ? 0 : 1.6;
    let busy = false;
    g.bridges.forEach((b, i) => {
      const dx = b.x - s.hinge.x;
      const dy = b.y - s.hinge.y;
      const tx = s.hinge.x + dx * cos - dy * sin + s.sx;
      const ty = s.hinge.y + dx * sin + dy * cos + s.sy;
      const ox = b.x + (up ? 0 : s.bx);
      const oy = b.y + (up ? s.bx : 0);
      const gx = tx - ox;
      const gy = ty - oy;
      const gap = Math.hypot(gx, gy);
      const near = fibres[i * 2];
      const far = fibres[i * 2 + 1];
      if (!near || !far) return;
      const live = s.phase !== 'idle' && !reduce.value;
      if (!s.snapped[i]) {
        if (!live || gap < 0.35) {
          near.style.opacity = '0';
          far.style.opacity = '0';
          return;
        }
        const k = clamp(gap / props.stretch, 0, 1);
        const sag = gap * 0.18;
        const w = (1.7 - 1.15 * k).toFixed(2);
        const cx = (up ? sag : 0) + gx / 2;
        const cy = (up ? 0 : sag) + gy / 2;
        near.setAttribute(
          'd',
          `M${f(ox - lx)},${f(oy - ly)}Q${f(ox - lx + cx)},${f(oy - ly + cy)} ${f(tx - lx)},${f(ty - ly)}`,
        );
        far.setAttribute(
          'd',
          `M${f(ox + lx)},${f(oy + ly)}Q${f(ox + lx + gx - cx)},${f(oy + ly + gy - cy)} ${f(tx + lx)},${f(ty + ly)}`,
        );
        near.style.strokeWidth = w;
        far.style.strokeWidth = w;
        near.style.opacity = '1';
        far.style.opacity = '1';
        s.span[i] = gap;
        return;
      }
      const snapAt = s.snapAt[i] ?? 0;
      const t = (now - snapAt) / 1000 / RETRACT;
      if (!live || t >= 1 || !snapAt) {
        near.style.opacity = '0';
        far.style.opacity = '0';
        return;
      }
      busy = true;
      const left = (1 - t) * (1 - t);
      const len = (s.span[i] || props.stretch) * 0.5 * left;
      const ux = gap > 0.01 ? gx / gap : 1;
      const uy = gap > 0.01 ? gy / gap : 0;
      near.setAttribute(
        'd',
        `M${f(ox)},${f(oy)}L${f(ox + ux * len)},${f(oy + uy * len)}`,
      );
      far.setAttribute(
        'd',
        `M${f(tx)},${f(ty)}L${f(tx - ux * len)},${f(ty - uy * len)}`,
      );
      near.style.strokeWidth = '0.9';
      far.style.strokeWidth = '0.9';
      near.style.opacity = left.toFixed(2);
      far.style.opacity = left.toFixed(2);
    });
    return busy;
  }

  function finish() {
    if (stubRef.value) stubRef.value.style.visibility = 'hidden';
    if (!controlled.value) inner.value = true;
    emit('update:torn', true);
    emit('tear');
  }

  function step(now: number) {
    const s = sim;
    const g = geo.value;
    const dt = clamp((now - s.last) / 1000, 0.001, 0.034);
    s.last = now;
    const limit = rad(props.tearAngle);
    if (s.phase === 'held') {
      const count = g.bridges.length;
      let intact = 0;
      for (let i = 0; i < count; i += 1) if (!s.snapped[i]) intact += 1;
      const hold = count ? intact / count : 0;
      const follow = 0.92 * (1 - clamp(props.resistance, 0, 0.95) * hold);
      const a = Math.atan2(s.point.y - s.hinge.y, s.point.x - s.hinge.x);
      const want = clamp(wrap(a - s.a0) * s.sign * follow, 0, limit + 0.1);
      s.theta += (want - s.theta) * (1 - Math.exp(-dt / 0.035));
      const up = g.vertical;
      const away = clamp(
        ((up ? s.point.y - s.start.y : s.point.x - s.start.x) || 0) * 0.05,
        -2,
        4,
      );
      const side = clamp(
        ((up ? s.point.x - s.start.x : s.point.y - s.start.y) || 0) * 0.05,
        -3,
        3,
      );
      const px = up ? side : away;
      const py = up ? away : side;
      s.sx += (px - s.sx) * (1 - Math.exp(-dt / 0.05));
      s.sy += (py - s.sy) * (1 - Math.exp(-dt / 0.05));
      const slack = Math.hypot(s.sx, s.sy);
      let left = 0;
      g.bridges.forEach((b, i) => {
        if (s.snapped[i]) return;
        const d = Math.abs(b.mid - s.hingeV);
        if (
          2 * d * Math.sin(s.theta / 2) + slack > props.stretch ||
          s.theta >= limit
        ) {
          s.snapped[i] = true;
          s.snapAt[i] = now;
          s.bv -= 560 / g.bridges.length;
        } else left += 1;
      });
      if (left === 0) {
        s.phase = 'free';
        s.bv -= 150;
      }
    } else if (s.phase === 'free') {
      const cos = Math.cos(s.theta * s.sign);
      const sin = Math.sin(s.theta * s.sign);
      const gx = s.grab.x - s.hinge.x;
      const gy = s.grab.y - s.hinge.y;
      const wx = s.point.x - s.hinge.x - (gx * cos - gy * sin);
      const wy = s.point.y - s.hinge.y - (gx * sin + gy * cos);
      s.sx += (wx - s.sx) * (1 - Math.exp(-dt / 0.045));
      s.sy += (wy - s.sy) * (1 - Math.exp(-dt / 0.045));
      const hang = limit * 0.55 + clamp(s.pvx * 0.0009 * s.sign, -0.3, 0.3);
      s.theta += (hang - s.theta) * (1 - Math.exp(-dt / 0.12));
    } else if (s.phase === 'drop') {
      s.age += dt;
      s.vy += GRAVITY * dt;
      s.sx += s.vx * dt;
      s.sy += s.vy * dt;
      s.theta += s.spin * dt;
      if (s.age > 0.16) s.fade = clamp(1 - (s.age - 0.16) / 0.42, 0, 1);
      if (s.fade <= 0) {
        s.phase = 'idle';
        finish();
      }
    } else if (s.phase === 'return') {
      s.thetaV += (-300 * s.theta - 24 * s.thetaV) * dt;
      s.theta += s.thetaV * dt;
      s.sx += (0 - s.sx) * (1 - Math.exp(-dt / 0.07));
      s.sy += (0 - s.sy) * (1 - Math.exp(-dt / 0.07));
      if (
        Math.abs(s.theta) < 0.0008 &&
        Math.abs(s.thetaV) < 0.01 &&
        Math.hypot(s.sx, s.sy) < 0.05
      ) {
        s.theta = 0;
        s.thetaV = 0;
        s.sx = 0;
        s.sy = 0;
        s.phase = 'idle';
      }
    }
    s.bv += (-520 * s.bx - 30 * s.bv) * dt;
    s.bx += s.bv * dt;
    const busy = paint(now);
    const moving = Math.abs(s.bx) > 0.02 || Math.abs(s.bv) > 0.5;
    if (s.phase !== 'idle' || moving || busy)
      s.raf = requestAnimationFrame(step);
    else {
      s.bx = 0;
      s.bv = 0;
      paint(now);
      s.raf = 0;
    }
  }

  function run() {
    if (sim.raf) return;
    sim.last = performance.now();
    sim.raf = requestAnimationFrame(step);
  }

  function reset() {
    cancelAnimationFrame(sim.raf);
    Object.assign(sim, {
      raf: 0,
      phase: 'idle',
      id: null,
      theta: 0,
      thetaV: 0,
      sx: 0,
      sy: 0,
      fade: 1,
      age: 0,
      bx: 0,
      bv: 0,
    });
    sim.snapped = [];
    sim.snapAt = [];
    sim.span = [];
    if (stubRef.value) stubRef.value.style.visibility = '';
    paint(performance.now());
  }

  function syncUsed(isUsed: boolean) {
    if (isUsed) {
      if (sim.phase === 'idle' && stubRef.value)
        stubRef.value.style.visibility = 'hidden';
      return;
    }
    instant.value = false;
    reset();
  }

  watch(used, syncUsed, { flush: 'post' });
  watch(geo, () => reset(), { flush: 'post' });

  onMounted(() => {
    syncUsed(used.value);
    applyTilt();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(sim.raf);
    unsubX();
    unsubY();
  });

  function local(e: PointerEvent) {
    const stage = stageRef.value;
    if (!stage) return { x: 0, y: 0 };
    const r = stage.getBoundingClientRect();
    const k = r.width / props.width || 1;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  }

  function tearNow() {
    cancelAnimationFrame(sim.raf);
    sim.raf = 0;
    sim.phase = 'idle';
    instant.value = true;
    finish();
  }

  function onStubDown(e: PointerEvent) {
    const s = sim;
    if (
      props.disabled ||
      used.value ||
      e.button !== 0 ||
      s.id !== null ||
      s.phase === 'drop'
    )
      return;
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }
    const p = local(e);
    const g = geo.value;
    s.id = e.pointerId;
    s.start = p;
    s.point = p;
    s.pt = performance.now();
    s.pvx = 0;
    s.pvy = 0;
    if (s.theta < 0.01) {
      const far = (g.vertical ? p.x : p.y) < g.cross / 2;
      const end = g.ends[far ? 1 : 0];
      s.sign = (far ? 1 : -1) * (g.vertical ? -1 : 1);
      s.hinge = { x: end.x, y: end.y };
      s.hingeV = end.v;
      if (stubRef.value)
        stubRef.value.style.transformOrigin = `${s.hinge.x}px ${s.hinge.y}px`;
    }
    const cos = Math.cos(-s.theta * s.sign);
    const sin = Math.sin(-s.theta * s.sign);
    const ux = p.x - s.sx - s.hinge.x;
    const uy = p.y - s.sy - s.hinge.y;
    s.grab = {
      x: s.hinge.x + ux * cos - uy * sin,
      y: s.hinge.y + ux * sin + uy * cos,
    };
    s.a0 =
      Math.atan2(s.grab.y - s.hinge.y, s.grab.x - s.hinge.x) -
      (s.theta * s.sign) / 0.92;
    s.phase = 'held';
    s.thetaV = 0;
    tiltX.set(0);
    tiltY.set(0);
    grabbing.value = true;
    run();
  }

  function onStubMove(e: PointerEvent) {
    const s = sim;
    if (s.id !== e.pointerId) return;
    const p = local(e);
    const now = performance.now();
    const dt = Math.max(0.004, (now - s.pt) / 1000);
    s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35;
    s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35;
    s.pt = now;
    s.point = p;
    if (reduce.value && Math.hypot(p.x - s.start.x, p.y - s.start.y) > 28) {
      s.id = null;
      grabbing.value = false;
      tearNow();
    }
  }

  function onStubUp(e: PointerEvent) {
    const s = sim;
    if (s.id !== e.pointerId) return;
    s.id = null;
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        if (target.hasPointerCapture(e.pointerId))
          target.releasePointerCapture(e.pointerId);
      } catch {
        // capture already gone
      }
    }
    grabbing.value = false;
    if (s.phase === 'free') {
      const still = performance.now() - s.pt > 80;
      s.vx = still ? 0 : clamp(s.pvx, -1600, 1600);
      s.vy = still ? 0 : clamp(s.pvy, -1600, 1200);
      s.spin = clamp(s.vx * 0.004, -6, 6) + 1.2 * s.sign;
      s.age = 0;
      s.phase = 'drop';
    } else if (s.phase === 'held') {
      s.phase = 'return';
    }
    run();
  }

  function onStubKey(e: KeyboardEvent) {
    if (props.disabled || used.value || (e.key !== 'Enter' && e.key !== ' '))
      return;
    e.preventDefault();
    if (!e.repeat) tearNow();
  }

  function onDragStart(e: DragEvent) {
    e.preventDefault();
  }

  // ---- styles -------------------------------------------------------------
  const rootStyle = computed<CSSProperties>(() => ({
    '--tt-w': `${props.width}px`,
    '--tt-h': `${props.height}px`,
    '--tt-stub': `${props.stubSize}px`,
    '--tt-bg': props.background,
    '--tt-stub-bg': props.stubBackground || props.background,
    '--tt-ink': props.color,
    '--tt-edge':
      props.borderColor ||
      `color-mix(in srgb, ${props.color} 16%, transparent)`,
    '--tt-edge-w': String(props.borderWidth),
    '--tt-parallax': `${props.parallax}px`,
    '--tt-body-w': `${vertical.value ? props.width : props.width - props.stubSize}px`,
    '--tt-body-h': `${vertical.value ? props.height - props.stubSize : props.height}px`,
    '--tt-inset': `${ART_INSET}px`,
    '--tt-span': String(ART_SPAN),
    '--tt-art-radius': `${props.imageRadius}px`,
    '--tt-fit': String(fit.value),
    height: `${props.height * fit.value}px`,
  }));

  const viewBox = computed(() => `0 0 ${props.width} ${props.height}`);
  const bodyClip = computed<CSSProperties>(() => ({
    clipPath: `path('${geo.value.body}')`,
  }));
  const stubClip = computed<CSSProperties>(() => ({
    clipPath: `path('${geo.value.stub}')`,
  }));
  const shift = computed(() =>
    used.value && props.recenter ? (vertical.value ? 'y' : 'x') : undefined,
  );
</script>

<template>
  <div
    ref="rootRef"
    :class="['tear-ticket', props.class]"
    :data-used="used ? '' : undefined"
    :data-orientation="orientation"
    :data-shift="shift"
    :data-instant="instant ? '' : undefined"
    :data-grabbing="grabbing ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <div ref="stageRef" class="tear-ticket__stage">
      <div ref="planeRef" class="tear-ticket__plane" :style="planeStyle">
        <div ref="bodyRef" class="tear-ticket__piece">
          <svg
            v-if="border"
            class="tear-ticket__edge"
            :viewBox="viewBox"
            aria-hidden="true"
          >
            <path :d="geo.bodyOutline" />
          </svg>
          <div class="tear-ticket__paper" :style="bodyClip">
            <div v-if="image" class="tear-ticket__art">
              <img
                ref="imageRef"
                class="tear-ticket__image"
                :src="image"
                :alt="imageAlt"
                draggable="false"
              />
              <div v-if="scrim" class="tear-ticket__scrim" />
            </div>
            <div ref="contentRef" class="tear-ticket__content">
              <slot />
            </div>
          </div>
        </div>
        <svg class="tear-ticket__fibres" aria-hidden="true">
          <g v-for="(b, i) in geo.bridges" :key="`${i}-${b.mid}`">
            <path :ref="(el) => setFibre(el, i * 2)" />
            <path :ref="(el) => setFibre(el, i * 2 + 1)" />
          </g>
        </svg>
        <div
          ref="stubRef"
          class="tear-ticket__piece tear-ticket__piece--stub"
          role="button"
          :tabindex="disabled || used ? -1 : 0"
          :aria-label="ariaLabel"
          :aria-hidden="used || undefined"
          :aria-disabled="disabled || undefined"
          @pointerdown="onStubDown"
          @pointermove="onStubMove"
          @pointerup="onStubUp"
          @pointercancel="onStubUp"
          @lostpointercapture="onStubUp"
          @keydown="onStubKey"
          @dragstart="onDragStart"
        >
          <svg
            v-if="border"
            class="tear-ticket__edge"
            :viewBox="viewBox"
            aria-hidden="true"
          >
            <path :d="geo.stubOutline" />
          </svg>
          <div
            class="tear-ticket__paper tear-ticket__paper--stub"
            :style="stubClip"
          >
            <div class="tear-ticket__stub">
              <slot name="stub" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <span class="tear-ticket__sr" role="status">{{ used ? 'Used' : '' }}</span>
  </div>
</template>

<style scoped>
  .tear-ticket {
    --tt-w: 460px;
    --tt-h: 250px;
    --tt-stub: 150px;
    --tt-bg: #27272a;
    --tt-stub-bg: #27272a;
    --tt-ink: #f5f5f5;
    --tt-edge: transparent;
    --tt-edge-w: 1;
    --tt-parallax: 6px;
    --tt-body-w: 310px;
    --tt-body-h: 250px;
    --tt-inset: 8px;
    --tt-span: 0.78;
    --tt-art-radius: 8px;
    --tt-fit: 1;

    position: relative;
    width: min(var(--tt-w), 100%);
    color: var(--tt-ink);
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .tear-ticket[data-disabled] {
    opacity: 0.6;
  }

  .tear-ticket__stage {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--tt-w);
    height: var(--tt-h);
    transform: scale(var(--tt-fit));
    transform-origin: top left;
    transition: transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tear-ticket[data-shift='x'] .tear-ticket__stage {
    transform: translateX(calc(var(--tt-stub) * var(--tt-fit) / 2))
      scale(var(--tt-fit));
  }

  .tear-ticket[data-shift='y'] .tear-ticket__stage {
    transform: translateY(calc(var(--tt-stub) * var(--tt-fit) / 2))
      scale(var(--tt-fit));
  }

  .tear-ticket__plane {
    position: absolute;
    inset: 0;
  }

  .tear-ticket__piece {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .tear-ticket__piece--stub {
    outline: none;
    will-change: transform;
  }

  .tear-ticket__piece--stub:focus-visible .tear-ticket__paper--stub {
    outline: 2px solid var(--ring, currentColor);
    outline-offset: -4px;
  }

  .tear-ticket__edge {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .tear-ticket__edge path {
    fill: none;
    stroke: var(--tt-edge);
    stroke-width: var(--tt-edge-w);
  }

  .tear-ticket__paper {
    position: absolute;
    inset: 0;
    background: var(--tt-bg);
    pointer-events: auto;
  }

  .tear-ticket__paper--stub {
    background: var(--tt-stub-bg);
    cursor: grab;
    touch-action: none;
  }

  .tear-ticket[data-grabbing] .tear-ticket__paper--stub {
    cursor: grabbing;
  }

  .tear-ticket[data-disabled] .tear-ticket__paper--stub {
    cursor: default;
  }

  .tear-ticket__art {
    position: absolute;
    top: var(--tt-inset);
    left: var(--tt-inset);
    width: calc(var(--tt-body-w) - var(--tt-inset) * 2);
    height: calc(var(--tt-body-h) * var(--tt-span) - var(--tt-inset) * 2);
    border-radius: var(--tt-art-radius);
    overflow: hidden;
  }

  .tear-ticket__image {
    position: absolute;
    top: calc(var(--tt-parallax) * -1);
    left: calc(var(--tt-parallax) * -1);
    width: calc(100% + var(--tt-parallax) * 2);
    max-width: none;
    height: calc(100% + var(--tt-parallax) * 2);
    object-fit: cover;
    -webkit-user-drag: none;
    transition: filter 700ms ease;
  }

  .tear-ticket[data-used] .tear-ticket__image {
    filter: grayscale(1) brightness(0.75);
  }

  .tear-ticket__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      var(--tt-bg) 0%,
      color-mix(in srgb, var(--tt-bg) 72%, transparent) 30%,
      color-mix(in srgb, var(--tt-bg) 18%, transparent) 58%,
      transparent 80%
    );
  }

  .tear-ticket__content {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(var(--tt-w) - var(--tt-stub));
    transition: opacity 500ms ease;
  }

  .tear-ticket[data-used] .tear-ticket__content {
    opacity: 0.55;
  }

  .tear-ticket__stub {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--tt-stub);
  }

  .tear-ticket[data-orientation='vertical'] .tear-ticket__content {
    bottom: auto;
    width: 100%;
    height: calc(var(--tt-h) - var(--tt-stub));
  }

  .tear-ticket[data-orientation='vertical'] .tear-ticket__stub {
    top: auto;
    left: 0;
    width: auto;
    height: var(--tt-stub);
  }

  .tear-ticket[data-instant] .tear-ticket__stage,
  .tear-ticket[data-instant] .tear-ticket__content,
  .tear-ticket[data-instant] .tear-ticket__image {
    transition-duration: 0ms;
  }

  .tear-ticket__fibres {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .tear-ticket__fibres path {
    fill: none;
    stroke: var(--tt-bg);
    stroke-linecap: round;
    opacity: 0;
  }

  .tear-ticket__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .tear-ticket__stage {
      transition: none;
    }
  }
</style>
