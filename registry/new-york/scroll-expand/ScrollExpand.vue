<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type { ScrollExpandProps } from './types';

  const clamp = (v: number, a: number, b: number) =>
    v < a ? a : v > b ? b : v;
  const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const props = withDefaults(defineProps<ScrollExpandProps>(), {
    mediaType: 'image',
    poster: '',
    alt: '',
    title: '',
    scrollHint: '',
    startWidth: 42,
    startHeight: 58,
    startRadius: 24,
    endRadius: 0,
    mediaZoom: 1.35,
    scrollDistance: 1.2,
    holdDistance: 0.35,
    smoothing: 0.1,
    overlayScrim: 0.45,
    useWindowScroll: false,
    enabled: true,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const trackRef = ref<HTMLDivElement | null>(null);
  const stageRef = ref<HTMLDivElement | null>(null);
  const frameRef = ref<HTMLDivElement | null>(null);
  const mediaRef = ref<HTMLImageElement | HTMLVideoElement | null>(null);
  const scrimRef = ref<HTMLDivElement | null>(null);
  const overlayRef = ref<HTMLDivElement | null>(null);
  const titleRef = ref<HTMLDivElement | null>(null);
  const hintRef = ref<HTMLDivElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();

  let raf = 0;
  let current = 0;
  let target = 0;
  let stageH = 0;
  let running = false;

  const measure = () => {
    const c = props;
    const root = rootRef.value;
    const stage = stageRef.value;
    const track = trackRef.value;
    if (!root || !stage || !track) return;
    stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
    if (stageH <= 0) return;
    stage.style.height = `${stageH}px`;
    track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;
    const w = root.clientWidth || stageH;
    stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
  };

  const readProgress = () => {
    const c = props;
    if (!c.enabled) return 1;
    const track = trackRef.value;
    const span = stageH * Math.max(0.01, c.scrollDistance);
    if (span <= 0) return 1;
    if (c.useWindowScroll) {
      const top = track?.getBoundingClientRect().top ?? 0;
      return clamp(-top / span, 0, 1);
    }
    return clamp((rootRef.value?.scrollTop ?? 0) / span, 0, 1);
  };

  const applyProgress = (p: number) => {
    const c = props;
    const e = smoothstep(0, 1, p);
    const frame = frameRef.value;
    const media = mediaRef.value;
    if (!frame || !media) return;
    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;
    const scrim = scrimRef.value;
    if (scrim) scrim.style.opacity = String(c.overlayScrim * e);
    const title = titleRef.value;
    if (title) {
      const out = smoothstep(0.4, 0.88, p);
      title.style.opacity = String(1 - out);
      title.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }
    const hint = hintRef.value;
    if (hint) {
      const gone = smoothstep(0, 0.12, p);
      hint.style.opacity = String(1 - gone);
      hint.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }
    const overlay = overlayRef.value;
    if (overlay) {
      const inn = smoothstep(0.68, 1, p);
      overlay.style.opacity = String(inn);
      overlay.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  };

  const tick = () => {
    const c = props;
    const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0004) {
      current = target;
      running = false;
    }
    applyProgress(current);
    if (running) raf = requestAnimationFrame(tick);
    else raf = 0;
  };

  const kick = () => {
    if (running) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    const c = props;
    target = readProgress();
    if (c.smoothing <= 0 || reducedMotion.value === 'reduce') {
      current = target;
      applyProgress(current);
      return;
    }
    kick();
  };

  const onResize = () => {
    measure();
    target = readProgress();
    current = target;
    applyProgress(current);
  };

  const scrollTarget = ref<HTMLDivElement | Window | null>(null);

  useEventListener(scrollTarget, 'scroll', onScroll, { passive: true });
  useEventListener('resize', onResize);
  useResizeObserver(rootRef, onResize);

  onMounted(() => {
    scrollTarget.value = props.useWindowScroll ? window : rootRef.value;
    onResize();
  });

  watch(
    () => props.useWindowScroll,
    (useWindow) => {
      scrollTarget.value = useWindow ? window : rootRef.value;
      onResize();
    },
    { flush: 'post' },
  );

  watch(
    [
      () => props.startWidth,
      () => props.startHeight,
      () => props.startRadius,
      () => props.endRadius,
      () => props.mediaZoom,
      () => props.scrollDistance,
      () => props.holdDistance,
      () => props.overlayScrim,
      () => props.enabled,
      () => props.title,
      () => props.scrollHint,
    ],
    onResize,
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    running = false;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'scroll-expand',
      !props.useWindowScroll ? 'scroll-expand--scroller' : '',
      props.class,
    ]"
    :style="props.style"
  >
    <div ref="trackRef" class="scroll-expand__track">
      <div ref="stageRef" class="scroll-expand__stage">
        <div ref="frameRef" class="scroll-expand__frame">
          <video
            v-if="props.mediaType === 'video'"
            ref="mediaRef"
            class="scroll-expand__media"
            :src="props.src"
            :poster="props.poster"
            autoplay
            muted
            loop
            playsinline
          />
          <img
            v-else
            ref="mediaRef"
            class="scroll-expand__media"
            :src="props.src"
            :alt="props.alt"
            draggable="false"
          />
          <div ref="scrimRef" class="scroll-expand__scrim" />
          <div
            v-if="$slots.default"
            ref="overlayRef"
            class="scroll-expand__overlay"
          >
            <slot />
          </div>
        </div>
        <div v-if="props.title" ref="titleRef" class="scroll-expand__title">
          {{ props.title }}
        </div>
        <div v-if="props.scrollHint" ref="hintRef" class="scroll-expand__hint">
          {{ props.scrollHint }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .scroll-expand {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .scroll-expand--scroller {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior: contain;
  }
  .scroll-expand--scroller::-webkit-scrollbar {
    display: none;
  }
  .scroll-expand__track {
    position: relative;
    width: 100%;
  }
  .scroll-expand__stage {
    position: sticky;
    top: 0;
    width: 100%;
    overflow: hidden;
    --se-title-size: 4rem;
  }
  .scroll-expand__frame {
    position: absolute;
    inset: 0;
    clip-path: inset(21% 29% 21% 29% round 24px);
    will-change: clip-path;
  }
  .scroll-expand__media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: transform;
    transform-origin: center;
    user-select: none;
    -webkit-user-drag: none;
  }
  .scroll-expand__scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.75),
      rgba(0, 0, 0, 0.1) 45%,
      rgba(0, 0, 0, 0.35)
    );
    opacity: 0;
  }
  .scroll-expand__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6%;
    opacity: 0;
    will-change: opacity, transform;
  }
  .scroll-expand__title {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0 6%;
    text-align: center;
    font-size: var(--se-title-size);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    color: #fff;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.45);
    pointer-events: none;
    will-change: opacity, transform;
  }
  .scroll-expand__hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 1.25rem;
    text-align: center;
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.55);
    pointer-events: none;
    will-change: opacity, transform;
  }
</style>
