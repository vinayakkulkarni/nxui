<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { DRIFT_WALL_DEFAULT_ITEMS, columnFactor } from './drift-wall';
  import type {
    DriftWallColumnMeta,
    DriftWallItem,
    DriftWallProps,
  } from './types';

  const props = withDefaults(defineProps<DriftWallProps>(), {
    items: () => DRIFT_WALL_DEFAULT_ITEMS,
    columns: 5,
    tileWidth: 200,
    tileHeight: 132,
    gap: 18,
    radius: 14,
    tilt: 16,
    turn: -14,
    roll: 0,
    perspective: 1200,
    depth: 120,
    speed: 42,
    direction: 'up',
    variance: 0.45,
    parallax: 0.6,
    pauseOnHover: false,
    lift: 64,
    fade: 0.6,
    dim: 0.55,
    grayscale: false,
    overlayColor: '#060010',
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const planeRef = ref<HTMLDivElement | null>(null);
  const trackEls = ref<HTMLDivElement[]>([]);

  const containerHeight = ref(600);
  const activeId = ref<string | null>(null);
  const visible = ref(true);

  const motionPref = usePreferredReducedMotion();
  const reduced = computed(() => motionPref.value === 'reduce');

  let offsets: number[] = [];
  let velocities: number[] = [];
  let hoveredCol = -1;
  let wallHovered = false;
  const pointer = { x: 0, y: 0 };
  const damped = { x: 0, y: 0 };

  const columnItems = computed<DriftWallItem[][]>(() => {
    const count = Math.max(1, Math.round(props.columns));
    const cols: DriftWallItem[][] = Array.from({ length: count }, () => []);
    props.items.forEach((item, i) => cols[i % count]!.push(item));
    return cols.map((col) => (col.length ? col : props.items.slice(0, 1)));
  });

  const columnMeta = computed<DriftWallColumnMeta[]>(() => {
    const unit = props.tileHeight + props.gap;
    return columnItems.value.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(
        2,
        Math.ceil((containerHeight.value * 1.6) / copyHeight) + 1,
      );
      return { copyHeight, copies };
    });
  });

  const baseVelocities = computed<number[]>(() => {
    const dirSign = props.direction === 'up' ? 1 : -1;
    return columnItems.value.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return props.speed * columnFactor(c, props.variance) * dirSign * altSign;
    });
  });

  watch(
    [columnMeta, columnItems],
    () => {
      offsets = columnMeta.value.map(
        (meta, c) => meta.copyHeight * ((c * 0.37) % 1),
      );
      velocities = columnItems.value.map(() => 0);
    },
    { immediate: true },
  );

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (entry) containerHeight.value = entry.contentRect.height || 600;
  });

  useIntersectionObserver(containerRef, (entries) => {
    visible.value = entries[0]?.isIntersecting ?? true;
  });

  function applyPlaneTransform(px: number, py: number) {
    const plane = planeRef.value;
    if (!plane) return;
    plane.style.transform =
      `translate(-50%, -50%) scale(1.18) ` +
      `rotateX(${props.tilt + py}deg) rotateY(${props.turn + px}deg) rotateZ(${props.roll}deg) ` +
      `translateZ(${-props.depth}px)`;
  }

  function trackIndex(el: HTMLDivElement) {
    return Number(el.dataset.col);
  }

  const { pause, resume } = useRafFn(({ delta }) => {
    const dt = Math.min(0.05, Math.max(0, delta) / 1000);

    const maxTilt = props.parallax * 8;
    const targetX = pointer.x * maxTilt;
    const targetY = -pointer.y * maxTilt;
    const damp = 1 - Math.exp(-dt / 0.12);
    damped.x += (targetX - damped.x) * damp;
    damped.y += (targetY - damped.y) * damp;
    applyPlaneTransform(damped.x, damped.y);

    const metas = columnMeta.value;
    const bases = baseVelocities.value;
    for (const el of trackEls.value) {
      const c = trackIndex(el);
      const meta = metas[c];
      if (!meta) continue;
      if (!reduced.value) {
        const paused = wallHovered && props.pauseOnHover;
        const factor = paused || hoveredCol === c ? 0 : 1;
        const target = (bases[c] ?? 0) * factor;
        const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        const v = velocities[c] ?? 0;
        velocities[c] = v + (target - v) * ease;
        let next = (offsets[c] ?? 0) + (velocities[c] ?? 0) * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        offsets[c] = next;
      }
      el.style.transform = `translate3d(0, ${-(offsets[c] ?? 0)}px, 0)`;
    }
  });

  watch(visible, (isVisible) => {
    if (isVisible) resume();
    else pause();
  });

  function activate(id: string, col: number) {
    activeId.value = id;
    hoveredCol = col;
  }

  function release() {
    activeId.value = null;
    hoveredCol = -1;
  }

  function onPointerMove(e: PointerEvent) {
    const rect = containerRef.value?.getBoundingClientRect();
    if (!rect) return;
    if (props.parallax > 0 && !reduced.value) {
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const tile = hit?.closest<HTMLElement>('[data-tile-id]');
    if (!tile) return;
    const id = tile.dataset.tileId ?? null;
    if (!id || id === activeId.value) return;
    activate(id, Number(tile.dataset.col));
  }

  function onPointerEnter() {
    wallHovered = true;
  }

  function onPointerLeave() {
    wallHovered = false;
    pointer.x = 0;
    pointer.y = 0;
    release();
  }

  function tileId(c: number, copyIndex: number, itemIndex: number) {
    return `${c}-${copyIndex}-${itemIndex}`;
  }

  function onTileFocus(e: FocusEvent) {
    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const id = el.dataset.tileId;
    if (id) activate(id, Number(el.dataset.col));
  }

  const cssVars = computed(() => ({
    '--dw-tile-w': `${props.tileWidth}px`,
    '--dw-tile-h': `${props.tileHeight}px`,
    '--dw-gap': `${props.gap}px`,
    '--dw-radius': `${props.radius}px`,
    '--dw-perspective': `${props.perspective}px`,
    '--dw-lift': `${props.lift}px`,
    '--dw-dim': String(props.dim),
    '--dw-gray': props.grayscale ? '1' : '0',
    '--dw-overlay': props.overlayColor,
    '--dw-edge': `${Math.max(0, (1 - props.fade) * 100)}%`,
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="['drift-wall', reduced && 'drift-wall--reduced', props.class]"
    :style="cssVars"
    role="group"
    aria-label="Drifting wall of tiles"
    @pointermove="onPointerMove"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div ref="planeRef" class="drift-wall__plane">
      <div
        v-for="(col, c) in columnItems"
        :key="`col-${c}`"
        class="drift-wall__col"
      >
        <div ref="trackEls" class="drift-wall__track" :data-col="c">
          <template
            v-for="copyIndex in columnMeta[c]?.copies ?? 2"
            :key="copyIndex"
          >
            <template
              v-for="(item, itemIndex) in col"
              :key="tileId(c, copyIndex, itemIndex)"
            >
              <a
                v-if="item.href"
                :href="item.href"
                target="_blank"
                rel="noreferrer noopener"
                :class="[
                  'drift-wall__tile',
                  activeId === tileId(c, copyIndex, itemIndex) && 'is-active',
                ]"
                :data-tile-id="tileId(c, copyIndex, itemIndex)"
                :data-col="c"
                :aria-label="item.title ?? 'tile'"
                @focus="onTileFocus"
                @blur="release"
              >
                <span class="drift-wall__inner">
                  <img
                    :src="item.image"
                    :alt="item.title ?? ''"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  <span class="drift-wall__overlay" aria-hidden="true" />
                </span>
              </a>
              <div
                v-else
                tabindex="0"
                role="button"
                :aria-label="item.title ?? 'tile'"
                :class="[
                  'drift-wall__tile',
                  activeId === tileId(c, copyIndex, itemIndex) && 'is-active',
                ]"
                :data-tile-id="tileId(c, copyIndex, itemIndex)"
                :data-col="c"
                @focus="onTileFocus"
                @blur="release"
              >
                <span class="drift-wall__inner">
                  <img
                    :src="item.image"
                    :alt="item.title ?? ''"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  <span class="drift-wall__overlay" aria-hidden="true" />
                </span>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .drift-wall {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    perspective: var(--dw-perspective, 1200px);
    perspective-origin: 50% 50%;
    -webkit-mask-image:
      radial-gradient(
        ellipse 78% 82% at 50% 46%,
        #000 var(--dw-edge),
        transparent 100%
      ),
      linear-gradient(to top, #000 var(--dw-edge), transparent 100%);
    -webkit-mask-composite: source-in;
    mask-image:
      radial-gradient(
        ellipse 78% 82% at 50% 46%,
        #000 var(--dw-edge),
        transparent 100%
      ),
      linear-gradient(to top, #000 var(--dw-edge), transparent 100%);
    mask-composite: intersect;
  }

  .drift-wall__plane {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: row;
    transform-style: preserve-3d;
    cursor: pointer;
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .drift-wall__col {
    position: relative;
    width: calc(var(--dw-tile-w) + var(--dw-gap));
    transform-style: preserve-3d;
  }

  .drift-wall__track {
    display: flex;
    flex-direction: column;
    will-change: transform;
    transform-style: preserve-3d;
  }

  .drift-wall__tile {
    position: relative;
    display: block;
    width: 100%;
    height: calc(var(--dw-tile-h) + var(--dw-gap));
    flex: 0 0 auto;
    outline: none;
    transform-style: preserve-3d;
  }

  .drift-wall__inner {
    position: absolute;
    inset: calc(var(--dw-gap) / 2);
    display: block;
    border-radius: var(--dw-radius);
    overflow: hidden;
    background: var(--dw-surface, #0b0b12);
    opacity: var(--dw-dim);
    transform: translateZ(0);
    pointer-events: none;
    transition:
      transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .drift-wall__tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: grayscale(var(--dw-gray)) saturate(0.92);
    transition: filter 0.42s cubic-bezier(0.22, 1, 0.36, 1);
    user-select: none;
    -webkit-user-drag: none;
  }

  .drift-wall__overlay {
    position: absolute;
    inset: 0;
    background: var(--dw-overlay);
    opacity: var(--dw-overlay-opacity, 0.42);
    pointer-events: none;
    transition: opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .drift-wall__tile.is-active .drift-wall__inner,
  .drift-wall__tile:focus-visible .drift-wall__inner {
    opacity: 1;
    transform: translateZ(var(--dw-lift));
    box-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.7);
  }

  .drift-wall__tile.is-active img,
  .drift-wall__tile:focus-visible img {
    filter: grayscale(0) saturate(1.05);
  }

  .drift-wall__tile.is-active .drift-wall__overlay,
  .drift-wall__tile:focus-visible .drift-wall__overlay {
    opacity: 0;
  }

  .drift-wall__tile:focus-visible .drift-wall__inner {
    box-shadow:
      0 24px 60px -18px rgba(0, 0, 0, 0.7),
      0 0 0 2px var(--dw-ring, rgba(255, 255, 255, 0.9));
  }

  @media (prefers-reduced-motion: reduce) {
    .drift-wall__plane,
    .drift-wall__track {
      will-change: auto;
    }
  }
</style>
