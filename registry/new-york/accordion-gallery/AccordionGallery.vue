<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { CSSProperties } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import {
    ACCORDION_GALLERY_DEFAULT_ITEMS,
    resolveEase,
    runTracks,
  } from './accordion-tween';
  import type {
    AccordionGalleryProps,
    AccordionPanelState,
    AccordionTweenTrack,
  } from './types';

  const props = withDefaults(defineProps<AccordionGalleryProps>(), {
    items: () => ACCORDION_GALLERY_DEFAULT_ITEMS,
    defaultIndex: 2,
    accentColor: '#ffffff',
    overlayColor: '#060010',
    textColor: '#ffffff',
    height: 460,
    gap: 10,
    radius: 16,
    expandRatio: 0.52,
    orientation: 'horizontal',
    duration: 0.6,
    ease: 'power3.out',
    parallax: 0.5,
    tilt: 8,
    stagger: 0.06,
    trigger: 'hover',
    showLabels: true,
    grayscale: true,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const panelEls = ref<HTMLElement[]>([]);

  const count = computed(() => props.items.length);
  const vertical = computed(() => props.orientation === 'vertical');
  const clampIndex = (i: number) =>
    Math.min(Math.max(i, 0), Math.max(count.value - 1, 0));
  const active = ref(clampIndex(props.defaultIndex));

  const motionPref = usePreferredReducedMotion();
  const reduced = computed(() => motionPref.value === 'reduce');

  let mediaSize = 320;
  let firstRun = true;
  let cancelTween: () => void = () => {};
  const states: AccordionPanelState[] = [];

  function freshState(): AccordionPanelState {
    return {
      grow: 1,
      rot: 0,
      mx: 0,
      my: 0,
      gray: 1,
      dim: 0.35,
      barOpacity: 0,
      barX: 0,
      textOpacity: 0,
      textX: 0,
    };
  }

  function stateAt(i: number): AccordionPanelState {
    let s = states[i];
    if (!s) {
      s = freshState();
      states[i] = s;
    }
    return s;
  }

  function writePanel(panel: HTMLElement, s: AccordionPanelState) {
    panel.style.flexGrow = String(s.grow);
    panel.style.transform = vertical.value
      ? `rotateX(${-s.rot}deg)`
      : `rotateY(${s.rot}deg)`;
    const frame = panel.querySelector<HTMLElement>('.ag-panel__frame');
    const media = panel.querySelector<HTMLElement>('.ag-panel__media');
    const bar = panel.querySelector<HTMLElement>('.ag-panel__bar');
    const text = panel.querySelector<HTMLElement>('.ag-panel__text');
    if (media) {
      media.style.transform = `translate(-50%, -50%) translate(${s.mx}px, ${s.my}px)`;
      media.style.setProperty('--ag-gray', String(s.gray));
    }
    frame?.style.setProperty('--ag-dim', String(s.dim));
    if (bar) {
      bar.style.opacity = String(s.barOpacity);
      bar.style.transform = `translateX(${s.barX}px)`;
    }
    if (text) {
      text.style.opacity = String(s.textOpacity);
      text.style.transform = `translateX(${s.textX}px)`;
    }
  }

  function applyLayout(animate: boolean) {
    const panels = panelEls.value;
    if (!panels.length) return;
    const n = count.value;
    const r = Math.min(Math.max(props.expandRatio, 0.2), 0.9);
    const grow = n > 1 ? (r * (n - 1)) / (1 - r) : 1;
    const dur = animate && !reduced.value ? props.duration : 0;
    const current = active.value;
    const tracks: AccordionTweenTrack[] = [];

    cancelTween();

    for (const panel of panels) {
      const i = Number(panel.dataset.index);
      const s = stateAt(i);
      const isActive = i === current;
      const rot = isActive ? 0 : i < current ? props.tilt : -props.tilt;
      const drift = Math.max(-1.5, Math.min(1.5, current - i));
      const shift = drift * props.parallax * mediaSize * 0.06;
      const write = () => writePanel(panel, s);
      const track = (
        key: keyof AccordionPanelState,
        to: number,
        duration = dur,
        delay = 0,
      ) => {
        tracks.push({
          from: s[key],
          to,
          delay,
          duration,
          apply: (v) => {
            s[key] = v;
            write();
          },
        });
      };

      track('grow', isActive ? grow : 1);
      track('rot', rot);
      track('mx', vertical.value ? 0 : isActive ? 0 : shift);
      track('my', vertical.value ? (isActive ? 0 : shift) : 0);
      track('gray', props.grayscale ? (isActive ? 0 : 1) : 0);
      track('dim', isActive ? 0 : 0.35);

      if (props.showLabels) {
        if (isActive) {
          const lag = reduced.value ? 0 : props.stagger;
          track('barOpacity', 1);
          track('barX', 0);
          track('textOpacity', 1, dur, dur > 0 ? lag : 0);
          track('textX', 0, dur, dur > 0 ? lag : 0);
        } else {
          track('barOpacity', 0, dur * 0.6);
          track('barX', -14, dur * 0.6);
          track('textOpacity', 0, dur * 0.6);
          track('textX', -14, dur * 0.6);
        }
      }
    }

    cancelTween = runTracks(tracks, resolveEase(props.ease));
  }

  function measure() {
    const el = rootRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = vertical.value ? rect.height : rect.width;
    const usable = Math.max(total - props.gap * (count.value - 1), 120);
    const r = Math.min(Math.max(props.expandRatio, 0.2), 0.9);
    mediaSize = Math.max(140, usable * r * 1.22);
    el.style.setProperty('--ag-media-size', `${mediaSize}px`);
    applyLayout(!firstRun);
  }

  useResizeObserver(rootRef, measure);

  onMounted(() => {
    measure();
    firstRun = false;
  });

  onBeforeUnmount(() => cancelTween());

  watch(
    [
      active,
      count,
      vertical,
      reduced,
      () => props.expandRatio,
      () => props.gap,
      () => props.duration,
      () => props.ease,
      () => props.tilt,
      () => props.parallax,
      () => props.grayscale,
      () => props.showLabels,
      () => props.stagger,
    ],
    () => {
      if (active.value > count.value - 1)
        active.value = clampIndex(active.value);
      measure();
    },
    { flush: 'post' },
  );

  function setActive(i: number) {
    active.value = clampIndex(i);
  }

  function onEnter(i: number) {
    if (props.trigger === 'hover') setActive(i);
  }

  function onClick(i: number, e: MouseEvent) {
    if (i !== active.value) {
      e.preventDefault();
      setActive(i);
    }
  }

  function focusPanel(i: number) {
    setActive(i);
    const panel = panelEls.value.find((p) => Number(p.dataset.index) === i);
    panel?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent) {
    const n = count.value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusPanel((i + 1) % n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusPanel((i - 1 + n) % n);
    }
  }

  const rootStyle = computed<CSSProperties>(() => ({
    '--ag-accent': props.accentColor,
    '--ag-overlay': props.overlayColor,
    '--ag-text': props.textColor,
    '--ag-gap': `${props.gap}px`,
    '--ag-radius': `${props.radius}px`,
    height: vertical.value
      ? `${Math.round(props.height * 1.6)}px`
      : `${props.height}px`,
  }));

  const panelStyle = computed(() => ({ borderRadius: `${props.radius}px` }));
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'accordion-gallery',
      vertical && 'accordion-gallery--vertical',
      props.class,
    ]"
    :style="rootStyle"
    role="list"
    aria-label="Image accordion gallery"
  >
    <component
      :is="item.link ? 'a' : 'div'"
      v-for="(item, i) in items"
      :key="i"
      ref="panelEls"
      :class="['ag-panel', i === active && 'ag-panel--active']"
      :style="panelStyle"
      :data-index="i"
      :href="item.link || undefined"
      role="listitem"
      tabindex="0"
      :aria-current="i === active ? 'true' : undefined"
      :aria-label="item.label"
      @click="onClick(i, $event)"
      @mouseenter="onEnter(i)"
      @focus="setActive(i)"
      @keydown="onKeyDown(i, $event)"
    >
      <span class="ag-panel__frame">
        <span class="ag-panel__media">
          <img
            :src="item.image"
            :alt="item.alt || item.label || ''"
            draggable="false"
          />
        </span>
        <span class="ag-panel__overlay" aria-hidden="true" />
      </span>
      <span v-if="showLabels" class="ag-panel__label" aria-hidden="true">
        <span class="ag-panel__bar" />
        <span class="ag-panel__text">{{ item.label }}</span>
      </span>
    </component>
  </div>
</template>

<style scoped>
  .accordion-gallery {
    --ag-accent: #ffffff;
    --ag-overlay: #060010;
    --ag-text: #ffffff;
    --ag-gap: 10px;
    --ag-radius: 16px;
    --ag-media-size: 320px;

    display: flex;
    flex-direction: row;
    gap: var(--ag-gap);
    width: 100%;
    max-width: 100%;
    perspective: 1400px;
    perspective-origin: 50% 50%;
  }

  .accordion-gallery--vertical {
    flex-direction: column;
  }

  .ag-panel {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--ag-radius);
    cursor: pointer;
    display: block;
    text-decoration: none;
    outline: none;
    transform-style: preserve-3d;
    transform-origin: center center;
    background: #0a0713;
    box-shadow: 0 10px 30px -18px rgba(0, 0, 0, 0.8);
    will-change: flex-grow, transform;
    -webkit-tap-highlight-color: transparent;
  }

  .ag-panel:focus-visible {
    box-shadow:
      0 0 0 2px var(--ag-accent),
      0 10px 30px -18px rgba(0, 0, 0, 0.8);
  }

  .ag-panel__frame {
    --ag-dim: 0.35;
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
  }

  .ag-panel__media {
    --ag-gray: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--ag-media-size);
    height: 100%;
    transform: translate(-50%, -50%);
    filter: grayscale(var(--ag-gray));
    will-change: transform, filter;
  }

  .accordion-gallery--vertical .ag-panel__media {
    width: 100%;
    height: var(--ag-media-size);
  }

  .ag-panel__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
  }

  .ag-panel__overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(
        180deg,
        transparent 45%,
        color-mix(in srgb, var(--ag-overlay) 78%, transparent) 100%
      ),
      color-mix(
        in srgb,
        var(--ag-overlay) calc(var(--ag-dim, 0.35) * 100%),
        transparent
      );
  }

  .ag-panel__label {
    position: absolute;
    left: 20px;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: none;
    z-index: 2;
  }

  .ag-panel__bar {
    flex: 0 0 auto;
    width: 3px;
    height: 26px;
    border-radius: 3px;
    background: var(--ag-accent);
    opacity: 0;
    box-shadow: 0 0 12px color-mix(in srgb, var(--ag-accent) 60%, transparent);
  }

  .ag-panel__text {
    color: var(--ag-text);
    font-family: inherit;
    font-weight: 600;
    font-size: clamp(1rem, 1.4vw, 1.4rem);
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  }

  @media (max-width: 520px) {
    .accordion-gallery {
      flex-direction: column;
      perspective: none;
      height: auto !important;
    }
    .ag-panel {
      min-height: 84px;
      transform: none !important;
    }
    .accordion-gallery .ag-panel__media {
      width: 100%;
      height: var(--ag-media-size);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ag-panel,
    .ag-panel__media {
      will-change: auto;
    }
  }
</style>
