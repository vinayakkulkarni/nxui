<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    DOME_GALLERY_DEFAULT_IMAGES,
    buildItems,
    clamp,
    computeItemBaseRotation,
    fitRadius,
    getDataNumber,
    normalizeAngle,
    wrapAngleSigned,
  } from './dome-gallery-utils';
  import type {
    DomeGalleryProps,
    DomeGalleryRect,
    DomeGalleryRotation,
  } from './types';

  const props = withDefaults(defineProps<DomeGalleryProps>(), {
    images: () => DOME_GALLERY_DEFAULT_IMAGES,
    fit: 0.5,
    fitBasis: 'auto',
    minRadius: 600,
    maxRadius: Infinity,
    padFactor: 0.25,
    overlayBlurColor: '#120F17',
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    enlargeTransitionMs: 300,
    segments: 35,
    dragDampening: 2,
    openedImageWidth: '400px',
    openedImageHeight: '400px',
    imageBorderRadius: '30px',
    openedImageBorderRadius: '30px',
    grayscale: true,
    class: '',
  });

  const rootRef = ref<HTMLElement | null>(null);
  const mainRef = ref<HTMLElement | null>(null);
  const sphereRef = ref<HTMLElement | null>(null);
  const frameRef = ref<HTMLElement | null>(null);
  const viewerRef = ref<HTMLElement | null>(null);

  let rotation: DomeGalleryRotation = { x: 0, y: 0 };
  let startRot: DomeGalleryRotation = { x: 0, y: 0 };
  let startPos: { x: number; y: number } | null = null;
  let lastSample = { x: 0, y: 0, t: 0, vx: 0, vy: 0 };
  let dragging = false;
  let moved = false;
  let inertiaRaf = 0;
  let opening = false;
  let openStartedAt = 0;
  let lastDragEndAt = 0;
  let focusedEl: HTMLElement | null = null;
  let originalTilePosition: DomeGalleryRect | null = null;
  let scrollLocked = false;
  const timers = new Set<number>();

  const motionPreference = usePreferredReducedMotion();

  const items = computed(() => buildItems(props.images, props.segments));

  const rootStyle = computed(() => ({
    '--segments-x': `${props.segments}`,
    '--segments-y': `${props.segments}`,
    '--overlay-blur-color': props.overlayBlurColor,
    '--tile-radius': props.imageBorderRadius,
    '--enlarge-radius': props.openedImageBorderRadius,
    '--image-filter': props.grayscale ? 'grayscale(1)' : 'none',
  }));

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  function lockScroll() {
    if (scrollLocked) return;
    scrollLocked = true;
    document.body.classList.add('dg-scroll-lock');
  }

  function unlockScroll() {
    if (!scrollLocked) return;
    if (rootRef.value?.getAttribute('data-enlarging') === 'true') return;
    scrollLocked = false;
    document.body.classList.remove('dg-scroll-lock');
  }

  function applyTransform(xDeg: number, yDeg: number) {
    const el = sphereRef.value;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }

  function measureCss(width: string, height: string) {
    const temp = document.createElement('div');
    temp.style.cssText = `position: absolute; width: ${width}; height: ${height}; visibility: hidden;`;
    document.body.appendChild(temp);
    const rect = temp.getBoundingClientRect();
    temp.remove();
    return rect;
  }

  function layout() {
    const root = rootRef.value;
    if (!root) return;
    const w = Math.max(1, root.clientWidth);
    const h = Math.max(1, root.clientHeight);
    const radius = fitRadius(
      w,
      h,
      props.fitBasis,
      props.fit,
      props.minRadius,
      props.maxRadius,
    );
    const viewerPad = Math.max(8, Math.round(Math.min(w, h) * props.padFactor));
    root.style.setProperty('--radius', `${radius}px`);
    root.style.setProperty('--viewer-pad', `${viewerPad}px`);
    applyTransform(rotation.x, rotation.y);

    const enlarged = viewerRef.value?.querySelector<HTMLElement>('.dg-enlarge');
    if (enlarged && frameRef.value && mainRef.value) {
      const frameR = frameRef.value.getBoundingClientRect();
      const mainR = mainRef.value.getBoundingClientRect();
      if (props.openedImageWidth && props.openedImageHeight) {
        const temp = measureCss(
          props.openedImageWidth,
          props.openedImageHeight,
        );
        enlarged.style.left = `${frameR.left - mainR.left + (frameR.width - temp.width) / 2}px`;
        enlarged.style.top = `${frameR.top - mainR.top + (frameR.height - temp.height) / 2}px`;
      } else {
        enlarged.style.left = `${frameR.left - mainR.left}px`;
        enlarged.style.top = `${frameR.top - mainR.top}px`;
        enlarged.style.width = `${frameR.width}px`;
        enlarged.style.height = `${frameR.height}px`;
      }
    }
  }

  useResizeObserver(rootRef, () => layout());
  watch(
    [
      () => props.fit,
      () => props.fitBasis,
      () => props.minRadius,
      () => props.maxRadius,
      () => props.padFactor,
      () => props.openedImageWidth,
      () => props.openedImageHeight,
    ],
    () => layout(),
    { flush: 'post' },
  );
  watch(
    () => props.maxVerticalRotationDeg,
    (max) => {
      rotation = { x: clamp(rotation.x, -max, max), y: rotation.y };
      applyTransform(rotation.x, rotation.y);
    },
  );

  onMounted(() => {
    layout();
    applyTransform(rotation.x, rotation.y);
  });

  function stopInertia() {
    if (inertiaRaf) {
      cancelAnimationFrame(inertiaRaf);
      inertiaRaf = 0;
    }
  }

  function startInertia(vx: number, vy: number) {
    if (motionPreference.value === 'reduce') return;
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = clamp(props.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);
    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        inertiaRaf = 0;
        return;
      }
      if (++frames > maxFrames) {
        inertiaRaf = 0;
        return;
      }
      const max = props.maxVerticalRotationDeg;
      const nextX = clamp(rotation.x - vY / 200, -max, max);
      const nextY = wrapAngleSigned(rotation.y + vX / 200);
      rotation = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
      inertiaRaf = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRaf = requestAnimationFrame(step);
  }

  function onPointerDown(event: PointerEvent) {
    if (focusedEl || event.button > 0) return;
    stopInertia();
    dragging = true;
    moved = false;
    startRot = { ...rotation };
    startPos = { x: event.clientX, y: event.clientY };
    lastSample = {
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
      vx: 0,
      vy: 0,
    };
  }

  function onPointerMove(event: PointerEvent) {
    if (focusedEl || !dragging || !startPos) return;
    const dxTotal = event.clientX - startPos.x;
    const dyTotal = event.clientY - startPos.y;
    if (!moved && dxTotal * dxTotal + dyTotal * dyTotal > 16) moved = true;
    const max = props.maxVerticalRotationDeg;
    const nextX = clamp(
      startRot.x - dyTotal / props.dragSensitivity,
      -max,
      max,
    );
    const nextY = wrapAngleSigned(startRot.y + dxTotal / props.dragSensitivity);
    if (rotation.x !== nextX || rotation.y !== nextY) {
      rotation = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
    }
    const now = performance.now();
    const dt = now - lastSample.t;
    if (dt > 0) {
      // Smoothed px/ms velocity, like the gesture library upstream uses.
      const ivx = (event.clientX - lastSample.x) / dt;
      const ivy = (event.clientY - lastSample.y) / dt;
      lastSample = {
        x: event.clientX,
        y: event.clientY,
        t: now,
        vx: lastSample.vx * 0.2 + ivx * 0.8,
        vy: lastSample.vy * 0.2 + ivy * 0.8,
      };
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (!dragging || !startPos) return;
    dragging = false;
    const stale = performance.now() - lastSample.t > 100;
    let vx = stale ? 0 : lastSample.vx;
    let vy = stale ? 0 : lastSample.vy;
    if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001) {
      const mx = event.clientX - startPos.x;
      const my = event.clientY - startPos.y;
      vx = clamp((mx / props.dragSensitivity) * 0.02, -1.2, 1.2);
      vy = clamp((my / props.dragSensitivity) * 0.02, -1.2, 1.2);
    }
    if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
    if (moved) lastDragEndAt = performance.now();
    moved = false;
    startPos = null;
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });

  function finishClose(parent: HTMLElement, el: HTMLElement) {
    parent.style.transition = 'none';
    el.style.transition = 'none';
    parent.style.setProperty('--rot-y-delta', '0deg');
    parent.style.setProperty('--rot-x-delta', '0deg');
    requestAnimationFrame(() => {
      el.style.visibility = '';
      el.style.opacity = '0';
      el.style.zIndex = '0';
      el.removeAttribute('data-focused');
      focusedEl = null;
      rootRef.value?.removeAttribute('data-enlarging');
      requestAnimationFrame(() => {
        parent.style.transition = '';
        el.style.transition = 'opacity 300ms ease-out';
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          later(() => {
            el.style.transition = '';
            el.style.opacity = '';
            opening = false;
            if (
              !dragging &&
              rootRef.value?.getAttribute('data-enlarging') !== 'true'
            ) {
              scrollLocked = false;
              document.body.classList.remove('dg-scroll-lock');
            }
          }, 300);
        });
      });
    });
  }

  function close() {
    if (performance.now() - openStartedAt < 250) return;
    const el = focusedEl;
    const root = rootRef.value;
    const parent = el?.parentElement;
    if (!el || !root || !parent) return;
    const overlay = viewerRef.value?.querySelector<HTMLElement>('.dg-enlarge');
    if (!overlay) return;
    const refDiv = parent.querySelector('.dg-item__image--reference');
    const originalPos = originalTilePosition;
    if (!originalPos) {
      overlay.remove();
      refDiv?.remove();
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      el.style.visibility = '';
      el.style.zIndex = '0';
      el.removeAttribute('data-focused');
      focusedEl = null;
      root.removeAttribute('data-enlarging');
      opening = false;
      unlockScroll();
      return;
    }
    const currentRect = overlay.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const closing = document.createElement('div');
    closing.className = 'dg-enlarge-closing';
    closing.style.cssText = `position:absolute;left:${currentRect.left - rootRect.left}px;top:${currentRect.top - rootRect.top}px;width:${currentRect.width}px;height:${currentRect.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${props.enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
    const originalImg = overlay.querySelector('img');
    if (originalImg) {
      const img = document.createElement('img');
      img.src = originalImg.src;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      closing.appendChild(img);
    }
    overlay.remove();
    root.appendChild(closing);
    void closing.getBoundingClientRect();
    requestAnimationFrame(() => {
      closing.style.left = `${originalPos.left - rootRect.left}px`;
      closing.style.top = `${originalPos.top - rootRect.top}px`;
      closing.style.width = `${originalPos.width}px`;
      closing.style.height = `${originalPos.height}px`;
      closing.style.opacity = '0';
    });
    closing.addEventListener(
      'transitionend',
      () => {
        closing.remove();
        originalTilePosition = null;
        refDiv?.remove();
        finishClose(parent, el);
      },
      { once: true },
    );
  }

  function openItemFromElement(el: HTMLElement) {
    if (opening) return;
    const parent = el.parentElement;
    const viewer = viewerRef.value;
    if (!parent || !viewer) return;
    opening = true;
    openStartedAt = performance.now();
    lockScroll();
    focusedEl = el;
    el.setAttribute('data-focused', 'true');
    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);
    const parentRot = computeItemBaseRotation(
      offsetX,
      offsetY,
      sizeX,
      sizeY,
      props.segments,
    );
    const parentY = normalizeAngle(parentRot.y);
    const globalY = normalizeAngle(rotation.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.x - rotation.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
    const refDiv = document.createElement('div');
    refDiv.className = 'dg-item__image dg-item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.x}deg) rotateY(${-parentRot.y}deg)`;
    parent.appendChild(refDiv);
    void refDiv.offsetHeight;

    const tileR = refDiv.getBoundingClientRect();
    const mainR = mainRef.value?.getBoundingClientRect();
    const frameR = frameRef.value?.getBoundingClientRect();
    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      opening = false;
      focusedEl = null;
      el.removeAttribute('data-focused');
      refDiv.remove();
      unlockScroll();
      return;
    }

    originalTilePosition = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height,
    };
    el.style.visibility = 'hidden';
    el.style.zIndex = '0';
    const overlay = document.createElement('div');
    overlay.className = 'dg-enlarge';
    overlay.style.position = 'absolute';
    overlay.style.left = `${frameR.left - mainR.left}px`;
    overlay.style.top = `${frameR.top - mainR.top}px`;
    overlay.style.width = `${frameR.width}px`;
    overlay.style.height = `${frameR.height}px`;
    overlay.style.opacity = '0';
    overlay.style.zIndex = '30';
    overlay.style.willChange = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition = `transform ${props.enlargeTransitionMs}ms ease, opacity ${props.enlargeTransitionMs}ms ease`;
    const img = document.createElement('img');
    img.src = parent.dataset.src || el.querySelector('img')?.src || '';
    img.alt = el.getAttribute('aria-label') ?? '';
    overlay.appendChild(img);
    viewer.appendChild(overlay);

    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;
    const validSx0 = Number.isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    const validSy0 = Number.isFinite(sy0) && sy0 > 0 ? sy0 : 1;
    overlay.style.transform = `translate(${tileR.left - frameR.left}px, ${tileR.top - frameR.top}px) scale(${validSx0}, ${validSy0})`;

    later(() => {
      if (!overlay.parentElement) return;
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
      rootRef.value?.setAttribute('data-enlarging', 'true');
    }, 16);

    if (props.openedImageWidth || props.openedImageHeight) {
      const duration = props.enlargeTransitionMs;
      const tempWidth = props.openedImageWidth || `${frameR.width}px`;
      const tempHeight = props.openedImageHeight || `${frameR.height}px`;
      const onFirstEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return;
        overlay.removeEventListener('transitionend', onFirstEnd);
        const prevTransition = overlay.style.transition;
        overlay.style.transition = 'none';
        overlay.style.width = tempWidth;
        overlay.style.height = tempHeight;
        const newRect = overlay.getBoundingClientRect();
        overlay.style.width = `${frameR.width}px`;
        overlay.style.height = `${frameR.height}px`;
        void overlay.offsetWidth;
        overlay.style.transition = `left ${duration}ms ease, top ${duration}ms ease, width ${duration}ms ease, height ${duration}ms ease`;
        const centeredLeft =
          frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
        const centeredTop =
          frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`;
          overlay.style.top = `${centeredTop}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
        });
        overlay.addEventListener(
          'transitionend',
          () => {
            overlay.style.transition = prevTransition;
          },
          { once: true },
        );
      };
      overlay.addEventListener('transitionend', onFirstEnd);
    }
  }

  function canOpen() {
    if (dragging || moved || opening) return false;
    return performance.now() - lastDragEndAt >= 80;
  }

  function onTileClick(event: MouseEvent) {
    if (!canOpen() || !(event.currentTarget instanceof HTMLElement)) return;
    openItemFromElement(event.currentTarget);
  }

  function onTilePointerUp(event: PointerEvent) {
    if (event.pointerType !== 'touch') return;
    if (!canOpen() || !(event.currentTarget instanceof HTMLElement)) return;
    openItemFromElement(event.currentTarget);
  }

  function onTileKey(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (opening || !(event.currentTarget instanceof HTMLElement)) return;
    openItemFromElement(event.currentTarget);
  }

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  });

  onBeforeUnmount(() => {
    stopInertia();
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    document.body.classList.remove('dg-scroll-lock');
  });
</script>

<template>
  <div ref="rootRef" :class="cn('dg-root', props.class)" :style="rootStyle">
    <main ref="mainRef" class="dg-main" @pointerdown="onPointerDown">
      <div class="dg-stage">
        <div ref="sphereRef" class="dg-sphere">
          <div
            v-for="(it, i) in items"
            :key="`${it.x},${it.y},${i}`"
            class="dg-item"
            :data-src="it.src"
            :data-offset-x="it.x"
            :data-offset-y="it.y"
            :data-size-x="it.sizeX"
            :data-size-y="it.sizeY"
            :style="{
              '--offset-x': `${it.x}`,
              '--offset-y': `${it.y}`,
              '--item-size-x': `${it.sizeX}`,
              '--item-size-y': `${it.sizeY}`,
            }"
          >
            <div
              class="dg-item__image"
              role="button"
              tabindex="0"
              :aria-label="it.alt || 'Open image'"
              @click="onTileClick"
              @pointerup="onTilePointerUp"
              @keydown="onTileKey"
            >
              <img :src="it.src" draggable="false" :alt="it.alt" />
            </div>
          </div>
        </div>
      </div>

      <div class="dg-overlay" />
      <div class="dg-overlay dg-overlay--blur" />
      <div class="dg-edge-fade dg-edge-fade--top" />
      <div class="dg-edge-fade dg-edge-fade--bottom" />

      <div ref="viewerRef" class="dg-viewer">
        <div class="dg-scrim" @click="close" />
        <div ref="frameRef" class="dg-frame" />
      </div>
    </main>
  </div>
</template>

<style>
  /* Unscoped: the enlarge overlays and reference tiles are created at runtime. */
  .dg-root {
    position: relative;
    width: 100%;
    height: 100%;
    --radius: 520px;
    --viewer-pad: 72px;
    --circ: calc(var(--radius) * 3.14);
    --rot-y: calc((360deg / var(--segments-x)) / 2);
    --rot-x: calc((360deg / var(--segments-y)) / 2);
    --item-width: calc(var(--circ) / var(--segments-x));
    --item-height: calc(var(--circ) / var(--segments-y));
  }

  .dg-root * {
    box-sizing: border-box;
  }

  .dg-sphere,
  .dg-item,
  .dg-item__image {
    transform-style: preserve-3d;
  }

  .dg-main {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    background: var(--overlay-blur-color, #120f17);
  }

  .dg-stage {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    perspective: calc(var(--radius) * 2);
    perspective-origin: 50% 50%;
    contain: layout paint size;
  }

  .dg-sphere {
    transform: translateZ(calc(var(--radius) * -1));
    will-change: transform;
  }

  .dg-overlay {
    position: absolute;
    inset: 0;
    margin: auto;
    z-index: 3;
    pointer-events: none;
    background-image: radial-gradient(
      rgba(235, 235, 235, 0) 65%,
      var(--overlay-blur-color, #120f17) 100%
    );
  }

  .dg-overlay--blur {
    background-image: none;
    -webkit-mask-image: radial-gradient(
      rgba(235, 235, 235, 0) 70%,
      var(--overlay-blur-color, #120f17) 90%
    );
    mask-image: radial-gradient(
      rgba(235, 235, 235, 0) 70%,
      var(--overlay-blur-color, #120f17) 90%
    );
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
  }

  .dg-item {
    width: calc(var(--item-width) * var(--item-size-x));
    height: calc(var(--item-height) * var(--item-size-y));
    position: absolute;
    top: -999px;
    bottom: -999px;
    left: -999px;
    right: -999px;
    margin: auto;
    transform-origin: 50% 50%;
    backface-visibility: hidden;
    transition: transform 300ms;
    transform: rotateY(
        calc(
          var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) +
            var(--rot-y-delta, 0deg)
        )
      )
      rotateX(
        calc(
          var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) +
            var(--rot-x-delta, 0deg)
        )
      )
      translateZ(var(--radius));
  }

  .dg-item__image {
    position: absolute;
    display: block;
    inset: 10px;
    border-radius: var(--tile-radius, 12px);
    background: var(--overlay-blur-color, #120f17);
    overflow: hidden;
    backface-visibility: hidden;
    transition: transform 300ms;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    pointer-events: auto;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .dg-item__image:focus {
    outline: none;
  }

  .dg-item__image:focus-visible {
    box-shadow: inset 0 0 0 3px var(--ring, #a1a1aa);
  }

  .dg-item__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    backface-visibility: hidden;
    filter: var(--image-filter, none);
  }

  .dg-viewer {
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--viewer-pad);
  }

  .dg-frame {
    height: 100%;
    aspect-ratio: 1;
    border-radius: var(--enlarge-radius, 32px);
    display: flex;
  }

  @media (max-aspect-ratio: 1/1) {
    .dg-frame {
      height: auto;
      width: 100%;
    }
  }

  .dg-scrim {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: none;
    opacity: 0;
    transition: opacity 500ms ease;
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
  }

  .dg-root[data-enlarging='true'] .dg-scrim {
    opacity: 1;
    pointer-events: all;
  }

  .dg-enlarge {
    position: absolute;
    z-index: 30;
    border-radius: var(--enlarge-radius, 32px);
    overflow: hidden;
    transition:
      transform 500ms ease,
      opacity 500ms ease;
    transform-origin: top left;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  .dg-enlarge img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: var(--image-filter, none);
  }

  .dg-enlarge-closing img {
    filter: var(--image-filter, none);
  }

  .dg-edge-fade {
    position: absolute;
    left: 0;
    right: 0;
    height: 120px;
    z-index: 5;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      transparent,
      var(--overlay-blur-color, #120f17)
    );
  }

  .dg-edge-fade--top {
    top: 0;
    transform: rotate(180deg);
  }

  .dg-edge-fade--bottom {
    bottom: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .dg-item,
    .dg-item__image,
    .dg-scrim {
      transition: none;
    }
  }
</style>
