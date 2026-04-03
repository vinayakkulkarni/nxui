<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface GalleryImage {
    src: string;
    alt?: string;
  }

  const props = withDefaults(
    defineProps<{
      images?: (string | GalleryImage)[];
      fit?: number;
      fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
      minRadius?: number;
      maxRadius?: number;
      padFactor?: number;
      overlayBlurColor?: string;
      maxVerticalRotationDeg?: number;
      dragSensitivity?: number;
      enlargeTransitionMs?: number;
      segments?: number;
      dragDampening?: number;
      openedImageWidth?: string;
      openedImageHeight?: string;
      imageBorderRadius?: string;
      openedImageBorderRadius?: string;
      grayscale?: boolean;
      class?: string;
    }>(),
    {
      images: () => [
        {
          src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop',
          alt: 'Abstract art',
        },
        {
          src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop',
          alt: 'Modern sculpture',
        },
        {
          src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop',
          alt: 'Digital artwork',
        },
        {
          src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop',
          alt: 'Contemporary art',
        },
        {
          src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop',
          alt: 'Geometric pattern',
        },
        {
          src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop',
          alt: 'Textured surface',
        },
      ],
      fit: 0.5,
      fitBasis: 'auto',
      minRadius: 600,
      maxRadius: Infinity,
      padFactor: 0.25,
      overlayBlurColor: '#060010',
      maxVerticalRotationDeg: 5,
      dragSensitivity: 20,
      enlargeTransitionMs: 300,
      segments: 35,
      dragDampening: 2,
      openedImageWidth: '250px',
      openedImageHeight: '350px',
      imageBorderRadius: '30px',
      openedImageBorderRadius: '30px',
      grayscale: true,
      class: '',
    },
  );

  const rootRef = ref<HTMLElement | null>(null);
  const mainRef = ref<HTMLElement | null>(null);
  const sphereRef = ref<HTMLElement | null>(null);
  const viewerRef = ref<HTMLElement | null>(null);
  const frameRef = ref<HTMLElement | null>(null);
  const scrimRef = ref<HTMLElement | null>(null);

  const rotation = ref({ x: 0, y: 0 });
  const enlarging = ref(false);

  let startRot = { x: 0, y: 0 };
  let startPos: { x: number; y: number } | null = null;
  let dragging = false;
  let moved = false;
  let inertiaRAF: number | null = null;
  let lastDragEndAt = 0;

  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }

  function wrapAngleSigned(deg: number): number {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
  }

  interface TileItem {
    x: number;
    y: number;
    sizeX: number;
    sizeY: number;
    src: string;
    alt: string;
  }

  const items = computed<TileItem[]>(() => {
    const xCols = Array.from({ length: props.segments }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
      const ys = c % 2 === 0 ? evenYs : oddYs;
      return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const pool = props.images.map((img) => {
      if (typeof img === 'string') return { src: img, alt: '' };
      return { src: img.src || '', alt: img.alt || '' };
    });

    if (pool.length === 0) {
      return coords.map((c) => ({ ...c, src: '', alt: '' }));
    }

    const totalSlots = coords.length;
    const usedImages = Array.from(
      { length: totalSlots },
      (_, i) => pool[i % pool.length],
    );

    for (let i = 1; i < usedImages.length; i++) {
      if (usedImages[i].src === usedImages[i - 1].src) {
        for (let j = i + 1; j < usedImages.length; j++) {
          if (usedImages[j].src !== usedImages[i].src) {
            const tmp = usedImages[i];
            usedImages[i] = usedImages[j];
            usedImages[j] = tmp;
            break;
          }
        }
      }
    }

    return coords.map((c, i) => ({
      ...c,
      src: usedImages[i].src,
      alt: usedImages[i].alt,
    }));
  });

  function applyTransform() {
    if (sphereRef.value) {
      sphereRef.value.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rotation.value.x}deg) rotateY(${rotation.value.y}deg)`;
    }
  }

  useResizeObserver(rootRef, (entries) => {
    const cr = entries[0].contentRect;
    const w = Math.max(1, cr.width);
    const h = Math.max(1, cr.height);
    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);
    const aspect = w / h;

    let basis: number;
    switch (props.fitBasis) {
      case 'min':
        basis = minDim;
        break;
      case 'max':
        basis = maxDim;
        break;
      case 'width':
        basis = w;
        break;
      case 'height':
        basis = h;
        break;
      default:
        basis = aspect >= 1.3 ? w : minDim;
    }

    let radius = basis * props.fit;
    const heightGuard = h * 1.35;
    radius = Math.min(radius, heightGuard);
    radius = clamp(radius, props.minRadius, props.maxRadius);

    const viewerPad = Math.max(8, Math.round(minDim * props.padFactor));

    if (rootRef.value) {
      rootRef.value.style.setProperty('--radius', `${Math.round(radius)}px`);
      rootRef.value.style.setProperty('--viewer-pad', `${viewerPad}px`);
    }

    applyTransform();
  });

  function stopInertia() {
    if (inertiaRAF !== null) {
      cancelAnimationFrame(inertiaRAF);
      inertiaRAF = null;
    }
  }

  function startInertia(vx: number, vy: number) {
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = clamp(props.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    function step() {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        inertiaRAF = null;
        return;
      }
      if (++frames > maxFrames) {
        inertiaRAF = null;
        return;
      }
      const nextX = clamp(
        rotation.value.x - vY / 200,
        -props.maxVerticalRotationDeg,
        props.maxVerticalRotationDeg,
      );
      const nextY = wrapAngleSigned(rotation.value.y + vX / 200);
      rotation.value = { x: nextX, y: nextY };
      applyTransform();
      inertiaRAF = requestAnimationFrame(step);
    }
    stopInertia();
    inertiaRAF = requestAnimationFrame(step);
  }

  let lastPointerTime = 0;
  let lastPointerPos = { x: 0, y: 0 };

  function onPointerDown(e: PointerEvent) {
    if (enlarging.value) return;
    stopInertia();
    dragging = true;
    moved = false;
    startRot = { ...rotation.value };
    startPos = { x: e.clientX, y: e.clientY };
    lastPointerTime = performance.now();
    lastPointerPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !startPos || enlarging.value) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    if (!moved && dx * dx + dy * dy > 16) {
      moved = true;
    }

    const nextX = clamp(
      startRot.x - dy / props.dragSensitivity,
      -props.maxVerticalRotationDeg,
      props.maxVerticalRotationDeg,
    );
    const nextY = wrapAngleSigned(startRot.y + dx / props.dragSensitivity);
    rotation.value = { x: nextX, y: nextY };
    applyTransform();

    lastPointerTime = performance.now();
    lastPointerPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;

    if (startPos) {
      const dt = Math.max(1, performance.now() - lastPointerTime);
      const vx = (e.clientX - lastPointerPos.x) / dt;
      const vy = (e.clientY - lastPointerPos.y) / dt;
      if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
        startInertia(vx, vy);
      }
    }

    if (moved) lastDragEndAt = performance.now();
    moved = false;
    startPos = null;
  }

  function onTileClick(e: Event) {
    if (moved) return;
    if (performance.now() - lastDragEndAt < 80) return;
    if (enlarging.value) return;

    const tile = e.currentTarget as HTMLElement;
    const parent = tile.closest('.dg-item') as HTMLElement;
    if (!parent || !mainRef.value || !frameRef.value || !viewerRef.value)
      return;

    enlarging.value = true;

    const src = parent.dataset.src || '';
    const frameR = frameRef.value.getBoundingClientRect();
    const mainR = mainRef.value.getBoundingClientRect();
    const tileR = tile.getBoundingClientRect();

    tile.style.visibility = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'dg-enlarge';
    overlay.style.cssText = `position:absolute;z-index:30;border-radius:${props.openedImageBorderRadius};overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);will-change:transform,opacity;transform-origin:top left;transition:transform ${props.enlargeTransitionMs}ms ease,opacity ${props.enlargeTransitionMs}ms ease;`;

    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width || 1;
    const sy0 = tileR.height / frameR.height || 1;

    overlay.style.left = `${frameR.left - mainR.left}px`;
    overlay.style.top = `${frameR.top - mainR.top}px`;
    overlay.style.width = `${frameR.width}px`;
    overlay.style.height = `${frameR.height}px`;
    overlay.style.opacity = '0';
    overlay.style.transform = `translate(${tx0}px,${ty0}px) scale(${sx0},${sy0})`;

    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    overlay.appendChild(img);
    viewerRef.value.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0,0) scale(1,1)';

      if (props.openedImageWidth || props.openedImageHeight) {
        const onEnd = () => {
          overlay.removeEventListener('transitionend', onEnd);
          overlay.style.transition = `left ${props.enlargeTransitionMs}ms ease,top ${props.enlargeTransitionMs}ms ease,width ${props.enlargeTransitionMs}ms ease,height ${props.enlargeTransitionMs}ms ease`;

          const tempW = props.openedImageWidth || `${frameR.width}px`;
          const tempH = props.openedImageHeight || `${frameR.height}px`;

          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `position:absolute;width:${tempW};height:${tempH};visibility:hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);

          const centeredLeft =
            frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
          const centeredTop =
            frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`;
            overlay.style.top = `${centeredTop}px`;
            overlay.style.width = tempW;
            overlay.style.height = tempH;
          });
        };
        overlay.addEventListener('transitionend', onEnd, { once: true });
      }
    });
  }

  function closeEnlarge() {
    if (!viewerRef.value) return;
    const overlay = viewerRef.value.querySelector('.dg-enlarge');
    if (!overlay) return;

    (overlay as HTMLElement).style.opacity = '0';
    (overlay as HTMLElement).style.transform = 'scale(0.8)';

    const onEnd = () => {
      overlay.remove();
      enlarging.value = false;
      const hidden = mainRef.value?.querySelector(
        '[style*="visibility: hidden"]',
      ) as HTMLElement | null;
      if (hidden) {
        hidden.style.visibility = '';
        hidden.style.opacity = '0';
        requestAnimationFrame(() => {
          hidden.style.transition = 'opacity 300ms ease-out';
          hidden.style.opacity = '1';
          setTimeout(() => {
            hidden.style.transition = '';
            hidden.style.opacity = '';
          }, 300);
        });
      }
    };
    overlay.addEventListener('transitionend', onEnd, { once: true });
  }

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && enlarging.value) closeEnlarge();
  });

  onMounted(() => {
    nextTick(() => applyTransform());
  });

  onBeforeUnmount(() => {
    stopInertia();
  });

  const rootStyles = computed(
    () =>
      ({
        '--segments-x': props.segments,
        '--segments-y': props.segments,
        '--overlay-blur-color': props.overlayBlurColor,
        '--tile-radius': props.imageBorderRadius,
        '--enlarge-radius': props.openedImageBorderRadius,
        '--image-filter': props.grayscale ? 'grayscale(1)' : 'none',
      }) as Record<string, string | number>,
  );
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('dg-root', $props.class)"
    :style="rootStyles"
    :data-enlarging="enlarging || undefined"
  >
    <main
      ref="mainRef"
      class="dg-main"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    >
      <div class="dg-stage">
        <div ref="sphereRef" class="dg-sphere">
          <div
            v-for="(it, i) in items"
            :key="`${it.x},${it.y},${i}`"
            class="dg-item"
            :data-src="it.src"
            :style="
              {
                '--offset-x': it.x,
                '--offset-y': it.y,
                '--item-size-x': it.sizeX,
                '--item-size-y': it.sizeY,
              } as Record<string, number>
            "
          >
            <div
              class="dg-item-image"
              role="button"
              tabindex="0"
              :aria-label="it.alt || 'Open image'"
              @click="onTileClick"
            >
              <img :src="it.src" :alt="it.alt" draggable="false" />
            </div>
          </div>
        </div>
      </div>

      <div class="dg-overlay"></div>
      <div class="dg-overlay dg-overlay--blur"></div>
      <div class="dg-edge-fade dg-edge-fade--top"></div>
      <div class="dg-edge-fade dg-edge-fade--bottom"></div>

      <div ref="viewerRef" class="dg-viewer">
        <div ref="scrimRef" class="dg-scrim" @click="closeEnlarge"></div>
        <div ref="frameRef" class="dg-frame"></div>
      </div>
    </main>
  </div>
</template>

<style scoped>
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
  .dg-item-image {
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
    background: transparent;
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
      var(--overlay-blur-color, #060010) 100%
    );
  }

  .dg-overlay--blur {
    background-image: none;
    -webkit-mask-image: radial-gradient(
      rgba(235, 235, 235, 0) 70%,
      var(--overlay-blur-color, #060010) 90%
    );
    mask-image: radial-gradient(
      rgba(235, 235, 235, 0) 70%,
      var(--overlay-blur-color, #060010) 90%
    );
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
        calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)))
      )
      rotateX(
        calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)))
      )
      translateZ(var(--radius));
  }

  .dg-item-image {
    position: absolute;
    display: block;
    inset: 10px;
    border-radius: var(--tile-radius, 12px);
    background: transparent;
    overflow: hidden;
    backface-visibility: hidden;
    transition: transform 300ms;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    pointer-events: auto;
    transform: translateZ(0);
  }

  .dg-item-image:focus {
    outline: none;
  }

  .dg-item-image img {
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
    backdrop-filter: blur(3px);
  }

  .dg-root[data-enlarging] .dg-scrim {
    opacity: 1;
    pointer-events: all;
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
      var(--overlay-blur-color, #060010)
    );
  }

  .dg-edge-fade--top {
    top: 0;
    transform: rotate(180deg);
  }

  .dg-edge-fade--bottom {
    bottom: 0;
  }
</style>
