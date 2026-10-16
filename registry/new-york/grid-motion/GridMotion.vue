<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    DIRECTIONS,
    INERTIA,
    PACE,
    THEMES,
    clamp,
    computeLayout,
    feather,
    smoothstep,
    toTile,
    wrap,
  } from './grid-motion-layout';
  import type { GridMotionProps, GridMotionTile } from './types';

  const props = withDefaults(defineProps<GridMotionProps>(), {
    items: () => [],
    rows: 4,
    aspectRatio: 1.33,
    gap: 16,
    radius: 14,
    angle: -12,
    tilt: 0,
    speed: 24,
    direction: 'alternate',
    parallax: 0.5,
    spotlight: 0.6,
    dim: 0.35,
    grayscale: false,
    fade: 0.5,
    tileColor: undefined,
    textColor: undefined,
    theme: 'dark',
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const planeRef = ref<HTMLDivElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const width = ref(0);
  const height = ref(0);
  const reducedMotion = usePreferredReducedMotion();

  const offsets: number[] = [];
  const shifts: number[] = [];
  const motion = {
    offsets,
    shifts,
    intro: 0,
    pointer: { x: 0, y: 0, active: false },
  };

  const settings = computed(() => ({
    rows: clamp(Math.round(props.rows), 1, 12),
    aspect: clamp(props.aspectRatio, 0.3, 4),
    gap: Math.max(0, props.gap),
    angle: props.angle,
    tilt: clamp(props.tilt, 0, 75),
    speed: props.speed,
    direction: DIRECTIONS.includes(props.direction)
      ? props.direction
      : 'alternate',
    parallax: clamp(props.parallax, 0, 1),
    spotlight: clamp(props.spotlight, 0, 1),
    dim: clamp(props.dim, 0, 1),
    fade: clamp(props.fade, 0, 1),
  }));

  const layout = computed(() =>
    computeLayout({
      width: width.value,
      height: height.value,
      rows: settings.value.rows,
      aspect: settings.value.aspect,
      gap: settings.value.gap,
      angle: settings.value.angle,
      tilt: settings.value.tilt,
    }),
  );

  const tiles = computed(() => props.items.map(toTile));

  const rowTiles = computed(() => {
    const l = layout.value;
    if (!l) return [];
    const list = tiles.value;
    const out: GridMotionTile[][] = [];
    for (let r = 0; r < settings.value.rows; r++) {
      const row: GridMotionTile[] = [];
      for (let k = 0; k < l.copies * l.perRow; k++) {
        const j = k % l.perRow;
        row.push(
          list.length
            ? list[(r * l.perRow + j) % list.length]!
            : { kind: 'empty', index: -1, item: null },
        );
      }
      out.push(row);
    }
    return out;
  });

  const rootStyle = computed(() => {
    const palette = THEMES[props.theme] ?? THEMES.dark;
    const s = settings.value;
    const mask =
      s.fade > 0
        ? `${feather('to right', s.fade * 34)}, ${feather('to bottom', s.fade * 44)}`
        : undefined;
    return {
      '--gm-tile': props.tileColor ?? palette.tile,
      '--gm-text': props.textColor ?? palette.text,
      '--gm-border': palette.border,
      '--gm-radius': `${Math.max(0, props.radius)}px`,
      '--gm-dim': String(s.dim),
      perspective:
        layout.value && s.tilt > 0
          ? `${layout.value.perspective}px`
          : undefined,
      maskImage: mask,
      WebkitMaskImage: mask,
      maskComposite: mask ? 'intersect' : undefined,
      WebkitMaskComposite: mask ? 'source-in' : undefined,
    };
  });

  const planeStyle = computed(() => {
    const l = layout.value;
    if (!l) return undefined;
    const s = settings.value;
    return {
      width: `${l.planeWidth}px`,
      height: `${l.planeHeight}px`,
      transform: `translate(-50%, -50%) rotateX(${s.tilt}deg) rotateZ(${s.angle}deg)`,
      '--gm-gap': `${s.gap}px`,
      '--gm-tile-w': `${l.tileWidth}px`,
      '--gm-tile-h': `${l.tileHeight}px`,
      '--gm-font': `${clamp(l.tileHeight * 0.12, 12, 32)}px`,
    };
  });

  function rowTop(r: number) {
    const l = layout.value;
    if (!l) return '0px';
    return `${l.top + r * (l.tileHeight + settings.value.gap)}px`;
  }

  useResizeObserver(rootRef, () => {
    const root = rootRef.value;
    if (!root) return;
    width.value = Math.round(root.clientWidth);
    height.value = Math.round(root.clientHeight);
  });

  function onMove(event: PointerEvent) {
    motion.pointer.x = event.clientX;
    motion.pointer.y = event.clientY;
    motion.pointer.active = true;
  }
  function onUp(event: PointerEvent) {
    if (event.pointerType === 'touch') motion.pointer.active = false;
  }
  function onLeave() {
    motion.pointer.active = false;
  }
  useEventListener('pointermove', onMove, { passive: true });
  useEventListener('pointerdown', onMove, { passive: true });
  useEventListener('pointerup', onUp);
  useEventListener('blur', onLeave);
  useEventListener(rootEl, 'pointerleave', onLeave);

  let rowEls: HTMLElement[] = [];
  let tileEls: HTMLElement[][] = [];
  let spots: Float32Array[] = [];
  let written: Float32Array[] = [];
  let visible = true;

  function frame(dtMs: number) {
    const root = rootRef.value;
    const plane = planeRef.value;
    const l = layout.value;
    if (!root || !plane || !l) return;
    const s = settings.value;
    const reduce = reducedMotion.value === 'reduce';
    const dt = Math.min(0.05, Math.max(0.001, dtMs / 1000));

    if (motion.intro < 1) {
      motion.intro = Math.min(1, motion.intro + dt / 0.9);
      plane.style.opacity = String(1 - (1 - motion.intro) ** 3);
    }

    const rect = root.getBoundingClientRect();
    const scale = rect.width ? root.clientWidth / rect.width : 1;
    const halfWidth = root.clientWidth / 2 || 1;
    const halfHeight = root.clientHeight / 2 || 1;
    const px = (motion.pointer.x - rect.left) * scale - halfWidth;
    const py = (motion.pointer.y - rect.top) * scale - halfHeight;
    const inside =
      motion.pointer.active &&
      Math.abs(px) <= halfWidth &&
      Math.abs(py) <= halfHeight;
    const lean = (s.tilt * Math.PI) / 180;
    const turn = (s.angle * Math.PI) / 180;
    const depth = l.perspective;
    let flatY = py;
    let flatX = px;
    if (lean > 0.0001) {
      flatY = (py * depth) / (depth * Math.cos(lean) + py * Math.sin(lean));
      flatX = (px * (depth - flatY * Math.sin(lean))) / depth;
    }
    const planeX = flatX * Math.cos(turn) + flatY * Math.sin(turn);
    const planeY = -flatX * Math.sin(turn) + flatY * Math.cos(turn);
    const nudge = motion.pointer.active ? clamp(px / halfWidth, -1, 1) : 0;
    const reach =
      (0.6 + 2.2 * s.spotlight) * Math.max(l.tileWidth, l.tileHeight);
    const settle = 1 - Math.exp(-dt / 0.22);

    rowEls.forEach((row, r) => {
      let drift = r % 2 ? 1 : -1;
      if (s.direction === 'left') drift = -1;
      else if (s.direction === 'right') drift = 1;
      if (motion.offsets[r] === undefined) {
        motion.offsets[r] = r * l.step * 0.37;
        motion.shifts[r] = 0;
      }
      if (!reduce)
        motion.offsets[r]! += s.speed * drift * PACE[r % PACE.length]! * dt;
      const target = reduce
        ? 0
        : s.parallax * l.tileWidth * 1.2 * nudge * (r % 2 ? -1 : 1);
      motion.shifts[r]! +=
        (target - motion.shifts[r]!) *
        (1 - Math.exp(-dt / INERTIA[r % INERTIA.length]!));
      const x =
        -l.period + wrap(motion.offsets[r]! + motion.shifts[r]!, l.period);
      row.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

      const rowY =
        l.top +
        r * (l.tileHeight + s.gap) +
        l.tileHeight / 2 -
        l.planeHeight / 2;
      const left = x - l.planeWidth / 2 + l.tileWidth / 2;
      const list = tileEls[r] ?? [];
      const values = spots[r];
      const marks = written[r];
      if (!values || !marks) return;
      for (let k = 0; k < list.length; k++) {
        let wanted = 0;
        if (inside && s.spotlight > 0) {
          const distance =
            Math.hypot(left + k * l.step - planeX, rowY - planeY) / reach;
          wanted = 1 - smoothstep(0.25, 1, distance);
        }
        values[k]! += (wanted - values[k]!) * settle;
        if (
          Math.abs(values[k]! - marks[k]!) > 0.004 ||
          (wanted === 0 && values[k]! < 0.004 && marks[k] !== 0)
        ) {
          marks[k] = values[k]! < 0.004 ? 0 : values[k]!;
          list[k]!.style.setProperty('--spot', marks[k]!.toFixed(3));
        }
      }
    });
  }

  const { pause, resume } = useRafFn(({ delta }) => frame(delta), {
    immediate: false,
  });

  function collect() {
    const plane = planeRef.value;
    if (!plane) {
      rowEls = [];
      tileEls = [];
      spots = [];
      written = [];
      pause();
      return;
    }
    rowEls = Array.from(plane.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    tileEls = rowEls.map((row) =>
      Array.from(row.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement,
      ),
    );
    spots = tileEls.map((list) => new Float32Array(list.length));
    written = tileEls.map((list) => new Float32Array(list.length));
    if (motion.intro >= 1) plane.style.opacity = '1';
    if (visible) resume();
  }

  watch([layout, tiles], () => nextTick(collect), { flush: 'post' });

  useIntersectionObserver(rootRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && rowEls.length) resume();
    else pause();
  });

  onMounted(() => {
    rootEl.value = document.documentElement;
    collect();
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn('grid-motion', props.grayscale && 'grid-motion--gray', props.class)
    "
    :style="rootStyle"
  >
    <div
      v-if="layout"
      ref="planeRef"
      class="grid-motion__plane"
      aria-hidden="true"
      :style="planeStyle"
    >
      <div
        v-for="(sequence, r) in rowTiles"
        :key="r"
        class="grid-motion__row"
        :style="{ top: rowTop(r) }"
      >
        <div v-for="(tile, k) in sequence" :key="k" class="grid-motion__tile">
          <slot name="tile" :tile="tile">
            <img
              v-if="tile.kind === 'image'"
              :src="tile.src"
              :alt="tile.alt"
              draggable="false"
              decoding="async"
            />
            <span v-else-if="tile.kind === 'text'" class="grid-motion__text">
              {{ tile.text }}
            </span>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .grid-motion {
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .grid-motion__plane {
    position: absolute;
    top: 50%;
    left: 50%;
    opacity: 0;
  }

  .grid-motion__row {
    position: absolute;
    left: 0;
    display: flex;
    gap: var(--gm-gap);
    will-change: transform;
  }

  .grid-motion__tile {
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--gm-tile-w);
    height: var(--gm-tile-h);
    overflow: hidden;
    border-radius: var(--gm-radius);
    background: var(--gm-tile);
    color: var(--gm-text);
    font-size: var(--gm-font);
    line-height: 1.2;
    text-align: center;
    opacity: calc(1 - var(--gm-dim) * (1 - var(--spot, 0)));
  }

  .grid-motion__tile::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--gm-border);
    pointer-events: none;
  }

  .grid-motion--gray .grid-motion__tile {
    filter: grayscale(calc(1 - var(--spot, 0)));
  }

  .grid-motion__tile img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }

  .grid-motion__text {
    padding: 0 1em;
  }
</style>
