<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { buildLevels } from './build-levels';
  import type {
    RefineFrameProps,
    RefineFrameSim,
    RefineFrameStage,
    RefineFrameStatus,
  } from './types';

  const props = withDefaults(defineProps<RefineFrameProps>(), {
    status: 'generating',
    aspectRatio: '4 / 3',
    width: 320,
    radius: 16,
    background: '#27272a',
    color: '#f5f5f5',
    stageDuration: 400,
    sweep: true,
    showStatus: true,
    hideAfter: 1200,
    labels: undefined,
    retryLabel: 'Retry',
    onRetry: undefined,
    class: '',
  });

  const STAGES: Record<RefineFrameStatus, RefineFrameStage> = {
    queued: { blur: 4, sat: 0.6, scale: 1.04, opacity: 0.55 },
    generating: { blur: 1.5, sat: 0.8, scale: 1.02, opacity: 0.85 },
    refining: { blur: 0.5, sat: 0.95, scale: 1.005, opacity: 1 },
    complete: { blur: 0, sat: 1, scale: 1, opacity: 1 },
    error: { blur: 2, sat: 0.5, scale: 1, opacity: 0.28 },
  };
  const TARGET: Partial<Record<RefineFrameStatus, number>> = {
    queued: 0,
    generating: 0.5,
    refining: 0.875,
    complete: 1,
  };
  const EDGE = 28;
  const STRIPS = 14;
  const DEFAULT_LABELS: Record<RefineFrameStatus, string> = {
    queued: 'Queued',
    generating: 'Generating',
    refining: 'Refining',
    complete: 'Ready',
    error: 'Failed',
  };
  const ACTIVE = new Set<RefineFrameStatus>([
    'queued',
    'generating',
    'refining',
  ]);

  const reducedPref = usePreferredReducedMotion();
  const reduce = computed(() => reducedPref.value === 'reduce');
  const stage = computed(() => STAGES[props.status] ?? STAGES.generating);
  const active = computed(() => ACTIVE.has(props.status));
  const text = computed(
    () =>
      ({ ...DEFAULT_LABELS, ...props.labels })[props.status] ?? props.status,
  );

  const rootRef = ref<HTMLDivElement | null>(null);
  const printRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const sim: RefineFrameSim = {
    p: 0,
    raf: 0,
    last: 0,
    key: '',
    w: 0,
    h: 0,
    levels: [],
    glint: null,
    sent: false,
  };
  const mosaic = ref(false);
  const resolved = ref(false);
  const chip = ref(props.showStatus);
  let visible = true;

  watch(
    [() => props.status, () => props.showStatus, () => props.hideAfter],
    ([status, showStatus, hideAfter], _old, onCleanup) => {
      if (!showStatus) {
        chip.value = false;
        return;
      }
      chip.value = true;
      if (status === 'complete' && hideAfter > 0) {
        const chipTimer = setTimeout(() => {
          chip.value = false;
        }, hideAfter);
        onCleanup(() => clearTimeout(chipTimer));
      }
    },
    { immediate: true },
  );

  function currentImg() {
    return printRef.value?.querySelector('img') ?? null;
  }

  function tick(now: number) {
    const s = sim;
    const canvas = canvasRef.value;
    const img = currentImg();
    if (!canvas || !img || !img.naturalWidth || !visible) {
      s.raf = 0;
      s.last = 0;
      return;
    }
    const dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : 0.016);
    s.last = now;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    buildLevels(s, canvas, img, dpr);
    const n = s.levels.length - 1;
    const target = TARGET[props.status] ?? s.p;
    const rate = reduce.value ? 1e9 : 1 / (n * (props.stageDuration / 1000));
    const step = rate * dt;
    if (target < s.p) s.p = target;
    else if (target - s.p <= step) s.p = target;
    else s.p += step;
    if (Math.abs(target - s.p) <= 0.0005) s.p = target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const L = s.p * n;
      const i = Math.min(n, Math.floor(L + 1e-6));
      const frac = L - i;
      const base = s.levels[i];
      const next = s.levels[i + 1];
      ctx.globalAlpha = 1;
      if (base) ctx.drawImage(base, 0, 0);
      if (i < n && frac > 0 && next) {
        const edge = EDGE * dpr;
        const front = frac * (s.h + edge) - edge / 2;
        const top = Math.max(0, Math.floor(front - edge / 2));
        if (top > 0) ctx.drawImage(next, 0, 0, s.w, top, 0, 0, s.w, top);
        const sh = edge / STRIPS;
        for (let k = 0; k < STRIPS; k += 1) {
          const y = front - edge / 2 + k * sh;
          if (y + sh <= 0 || y >= s.h) continue;
          const t = 1 - (k + 0.5) / STRIPS;
          ctx.globalAlpha = t * t * (3 - 2 * t);
          const y0 = Math.max(0, y);
          const h0 = Math.min(s.h, y + sh) - y0;
          if (h0 > 0) ctx.drawImage(next, 0, y0, s.w, h0, 0, y0, s.w, h0);
        }
        ctx.globalAlpha = 1;
        if (
          props.sweep &&
          !reduce.value &&
          s.glint &&
          front > 0 &&
          front < s.h
        ) {
          ctx.fillStyle = s.glint;
          ctx.globalAlpha = 0.12;
          ctx.fillRect(0, front - 2 * dpr, s.w, 4 * dpr);
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, front - dpr, s.w, 2 * dpr);
          ctx.globalAlpha = 1;
        }
      }
    }
    const done = s.p >= 1;
    if (done !== s.sent) {
      s.sent = done;
      resolved.value = done;
    }
    const keep =
      (!reduce.value && ACTIVE.has(props.status)) ||
      Math.abs(target - s.p) > 0.0005;
    s.raf = keep ? requestAnimationFrame(tick) : 0;
    if (!keep) s.last = 0;
  }

  function wake() {
    if (!sim.raf && visible) sim.raf = requestAnimationFrame(tick);
  }

  let watchedImg: HTMLImageElement | null = null;
  let watchedSrc = '';
  function onImgLoad() {
    mosaic.value = true;
    wake();
  }
  function attachImage() {
    const img = currentImg();
    const src = img?.currentSrc || img?.src || '';
    if (img === watchedImg && src === watchedSrc) {
      if (img?.complete && img.naturalWidth) onImgLoad();
      return;
    }
    watchedImg?.removeEventListener('load', onImgLoad);
    watchedImg = img;
    watchedSrc = src;
    if (!img) {
      mosaic.value = false;
      return;
    }
    if (img.complete && img.naturalWidth) onImgLoad();
    else img.addEventListener('load', onImgLoad, { once: true });
  }

  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[0];
    visible = entry ? entry.isIntersecting : true;
    if (visible) wake();
  });

  watch(
    () => props.status,
    () => attachImage(),
    { flush: 'post' },
  );
  watch(
    [() => props.status, () => props.width, () => props.aspectRatio],
    () => wake(),
    { flush: 'post' },
  );

  onMounted(attachImage);
  onUpdated(() => {
    const img = currentImg();
    if (
      img !== watchedImg ||
      (img?.currentSrc || img?.src || '') !== watchedSrc
    )
      attachImage();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(sim.raf);
    sim.raf = 0;
    watchedImg?.removeEventListener('load', onImgLoad);
  });

  function retry() {
    props.onRetry?.();
  }

  const markIcon = computed(() =>
    props.status === 'complete'
      ? 'lucide:check'
      : props.status === 'error'
        ? 'lucide:triangle-alert'
        : 'lucide:loader-circle',
  );

  const rootStyle = computed<CSSProperties>(() => ({
    '--rf-w': `${props.width}px`,
    '--rf-aspect': props.aspectRatio,
    '--rf-radius': `${props.radius}px`,
    '--rf-bg': props.background,
    '--rf-ink': props.color,
    '--rf-stage': `${props.stageDuration}ms`,
    '--rf-blur': `${mosaic.value ? 0 : stage.value.blur}px`,
    '--rf-sat': stage.value.sat,
    '--rf-scale': mosaic.value ? 1 : stage.value.scale,
    '--rf-opacity': stage.value.opacity,
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="['refine-frame', props.class]"
    role="img"
    :aria-label="text"
    :aria-busy="active || undefined"
    :data-status="status"
    :data-active="active ? '' : undefined"
    :data-sweep="sweep && active ? '' : undefined"
    :data-mosaic="mosaic ? '' : undefined"
    :data-resolved="mosaic && resolved ? '' : undefined"
    :style="rootStyle"
  >
    <div class="refine-frame__media" aria-hidden="true">
      <div ref="printRef" class="refine-frame__print">
        <slot></slot>
      </div>
      <canvas ref="canvasRef" class="refine-frame__mosaic"></canvas>
    </div>
    <div class="refine-frame__sweep" aria-hidden="true"></div>
    <div v-if="chip" class="refine-frame__chip" aria-hidden="true">
      <span class="refine-frame__mark" :data-kind="active ? 'spin' : status">
        <Icon :name="markIcon" />
      </span>
      <span :key="status" class="refine-frame__label">{{ text }}</span>
    </div>
    <button
      v-if="status === 'error' && onRetry"
      type="button"
      class="refine-frame__retry"
      @click="retry"
    >
      <Icon name="lucide:refresh-cw" class="size-3.5" />
      <span>{{ retryLabel }}</span>
    </button>
    <span class="refine-frame__sr" role="status">{{ text }}</span>
  </div>
</template>

<style scoped>
  .refine-frame {
    --rf-w: 320px;
    --rf-aspect: 4 / 3;
    --rf-radius: 16px;
    --rf-bg: #27272a;
    --rf-ink: #f5f5f5;
    --rf-stage: 400ms;
    --rf-blur: 1.5px;
    --rf-sat: 0.8;
    --rf-scale: 1.02;
    --rf-opacity: 0.85;
    --rf-error: #ef4444;
    --rf-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    isolation: isolate;
    width: min(var(--rf-w), 100%);
    aspect-ratio: var(--rf-aspect);
    border-radius: var(--rf-radius);
    overflow: hidden;
    background: var(--rf-bg);
    color: var(--rf-ink);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
  }

  .refine-frame__media {
    position: absolute;
    inset: 0;
    opacity: var(--rf-opacity);
    filter: blur(var(--rf-blur)) saturate(var(--rf-sat));
    transform: scale(var(--rf-scale));
    transition:
      opacity var(--rf-stage) var(--rf-ease-out),
      filter var(--rf-stage) var(--rf-ease-out),
      transform var(--rf-stage) var(--rf-ease-out);
  }

  .refine-frame[data-status='queued'] .refine-frame__media {
    animation: refine-frame-wait 2.4s ease-in-out infinite;
  }

  @keyframes refine-frame-wait {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 0.65;
    }
  }

  .refine-frame__print {
    width: 100%;
    height: 100%;
    transition: opacity var(--rf-stage) ease;
  }

  .refine-frame__print > :deep(*) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .refine-frame[data-mosaic] .refine-frame__print {
    opacity: 0;
  }

  .refine-frame[data-resolved] .refine-frame__print {
    opacity: 1;
  }

  .refine-frame__mosaic {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--rf-stage) ease;
  }

  .refine-frame[data-mosaic] .refine-frame__mosaic {
    opacity: 1;
  }

  .refine-frame[data-resolved] .refine-frame__mosaic {
    opacity: 0;
  }

  .refine-frame__sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      115deg,
      transparent 38%,
      color-mix(in srgb, var(--rf-ink) 14%, transparent) 50%,
      transparent 62%
    );
    background-size: 260% 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--rf-stage) ease;
  }

  .refine-frame[data-sweep]:not([data-mosaic]) .refine-frame__sweep {
    opacity: 1;
    animation: refine-frame-sweep 2.2s linear infinite;
  }

  @keyframes refine-frame-sweep {
    from {
      background-position: 130% 0;
    }

    to {
      background-position: -130% 0;
    }
  }

  .refine-frame__chip {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 10px 0 8px;
    border-radius: 13px;
    background: color-mix(in srgb, var(--rf-bg) 72%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 1;
    transform: translateY(0);
    pointer-events: none;
    transition:
      opacity 200ms ease,
      transform 200ms var(--rf-ease-out);
  }

  @starting-style {
    .refine-frame__chip {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  .refine-frame__mark {
    display: inline-flex;
    font-size: 13px;
    color: color-mix(in srgb, var(--rf-ink) 80%, transparent);
  }

  .refine-frame__mark[data-kind='spin'] {
    animation: refine-frame-spin 1.1s linear infinite;
  }

  .refine-frame__mark[data-kind='error'] {
    color: var(--rf-error);
  }

  @keyframes refine-frame-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .refine-frame__label {
    animation: refine-frame-label 200ms ease both;
  }

  @keyframes refine-frame-label {
    from {
      opacity: 0;
      filter: blur(2px);
    }
  }

  .refine-frame__retry {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px 0 12px;
    border: 0;
    border-radius: 16px;
    background: color-mix(in srgb, var(--rf-ink) 14%, var(--rf-bg));
    color: var(--rf-ink);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    -webkit-tap-highlight-color: transparent;
    transition:
      opacity 200ms ease,
      transform 160ms var(--rf-ease-out),
      background-color 150ms ease;
  }

  .refine-frame__retry:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--rf-ink) 60%, transparent);
  }

  @starting-style {
    .refine-frame__retry {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.96);
    }
  }

  .refine-frame__retry:active {
    transform: translate(-50%, -50%) scale(0.96);
  }

  @media (hover: hover) and (pointer: fine) {
    .refine-frame__retry:hover {
      background: color-mix(in srgb, var(--rf-ink) 20%, var(--rf-bg));
    }
  }

  .refine-frame__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .refine-frame__media {
      transition: opacity var(--rf-stage) ease;
    }

    .refine-frame[data-sweep] .refine-frame__sweep {
      animation: none;
      opacity: 0;
    }

    .refine-frame[data-status='queued'] .refine-frame__media {
      animation: none;
    }

    .refine-frame__mark[data-kind='spin'] {
      animation: none;
    }

    .refine-frame__chip,
    .refine-frame__retry {
      transition: opacity 200ms ease;
    }

    .refine-frame__retry:active {
      transform: translate(-50%, -50%);
    }
  }
</style>
