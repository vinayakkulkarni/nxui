<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      imageSrc: string;
      rotate?: number;
      peelBackHoverPct?: number;
      peelBackActivePct?: number;
      width?: number;
      shadowIntensity?: number;
      lightingIntensity?: number;
      peelDirection?: number;
      class?: string;
    }>(),
    {
      rotate: 30,
      peelBackHoverPct: 30,
      peelBackActivePct: 40,
      width: 200,
      shadowIntensity: 0.6,
      lightingIntensity: 0.1,
      peelDirection: 0,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  const dragTargetRef = ref<HTMLDivElement | null>(null);
  const pointLightRef = ref<SVGFEPointLightElement | null>(null);
  const pointLightFlippedRef = ref<SVGFEPointLightElement | null>(null);

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentX = 0;
  let currentY = 0;

  const filterId = `sticker-${Math.random().toString(36).slice(2, 9)}`;

  const cssVars = computed(() => ({
    '--sticker-rotate': `${props.rotate}deg`,
    '--sticker-p': '10px',
    '--sticker-peelback-hover': `${props.peelBackHoverPct}%`,
    '--sticker-peelback-active': `${props.peelBackActivePct}%`,
    '--sticker-width': `${props.width}px`,
    '--peel-direction': `${props.peelDirection}deg`,
  }));

  function onPointerDown(e: PointerEvent) {
    isDragging = true;
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    dragStartX = e.clientX - currentX;
    dragStartY = e.clientY - currentY;
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging || !dragTargetRef.value) return;
    currentX = e.clientX - dragStartX;
    currentY = e.clientY - dragStartY;
    dragTargetRef.value.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }

  function onPointerUp(e: PointerEvent) {
    isDragging = false;
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
  }

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const rect = containerRef.value?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointLightRef.value?.setAttribute('x', String(x));
    pointLightRef.value?.setAttribute('y', String(y));
    if (pointLightFlippedRef.value) {
      const angle = Math.abs(props.peelDirection % 360);
      if (angle !== 180) {
        pointLightFlippedRef.value.setAttribute('x', String(x));
        pointLightFlippedRef.value.setAttribute('y', String(rect.height - y));
      }
    }
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    const addActive = () => container.classList.add('touch-active');
    const removeActive = () => container.classList.remove('touch-active');
    container.addEventListener('touchstart', addActive);
    container.addEventListener('touchend', removeActive);
    container.addEventListener('touchcancel', removeActive);
  });
</script>

<template>
  <div
    ref="dragTargetRef"
    :class="cn('sticker-draggable', $props.class)"
    :style="cssVars"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <svg width="0" height="0">
      <defs>
        <filter :id="`${filterId}-light`">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feSpecularLighting
            result="spec"
            in="blur"
            specularExponent="100"
            :specularConstant="lightingIntensity"
            lighting-color="white"
          >
            <fePointLight ref="pointLightRef" x="100" y="100" z="300" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
        <filter :id="`${filterId}-light-flip`">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feSpecularLighting
            result="spec"
            in="blur"
            specularExponent="100"
            :specularConstant="lightingIntensity * 7"
            lighting-color="white"
          >
            <fePointLight ref="pointLightFlippedRef" x="100" y="100" z="300" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
        <filter :id="`${filterId}-shadow`">
          <feDropShadow
            dx="2" dy="4"
            :stdDeviation="3 * shadowIntensity"
            flood-color="black"
            :flood-opacity="shadowIntensity"
          />
        </filter>
        <filter :id="`${filterId}-fill`">
          <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
          <feFlood flood-color="rgb(179,179,179)" result="flood" />
          <feComposite operator="in" in="flood" in2="shape" />
        </filter>
      </defs>
    </svg>

    <div ref="containerRef" class="sticker-container">
      <div class="sticker-main" :style="{ filter: `url(#${filterId}-shadow)` }">
        <div class="sticker-lighting" :style="{ filter: `url(#${filterId}-light)` }">
          <img :src="imageSrc" alt="" class="sticker-image" draggable="false" @contextmenu.prevent />
        </div>
      </div>
      <div class="flap">
        <div class="flap-lighting" :style="{ filter: `url(#${filterId}-light-flip)` }">
          <img :src="imageSrc" alt="" class="flap-image" draggable="false" :style="{ filter: `url(#${filterId}-fill)` }" @contextmenu.prevent />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .sticker-draggable {
    position: absolute;
    cursor: grab;
    transform: translateZ(0);
    user-select: none;
  }

  .sticker-draggable:active {
    cursor: grabbing;
  }

  .sticker-container {
    position: relative;
    transform: rotate(var(--peel-direction));
    transform-origin: center;
  }

  .sticker-container * {
    user-select: none;
    -webkit-touch-callout: none;
  }

  .sticker-main {
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(100% + var(--sticker-p)),
      calc(-1 * var(--sticker-p)) calc(100% + var(--sticker-p))
    );
    transition: clip-path 0.6s ease-out;
  }

  .sticker-main > * {
    transform: rotate(calc(-1 * var(--peel-direction)));
  }

  .sticker-container:hover .sticker-main,
  .sticker-container.touch-active .sticker-main {
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) var(--sticker-peelback-hover),
      calc(100% + var(--sticker-p)) var(--sticker-peelback-hover),
      calc(100% + var(--sticker-p)) calc(100% + var(--sticker-p)),
      calc(-1 * var(--sticker-p)) calc(100% + var(--sticker-p))
    );
  }

  .sticker-container:active .sticker-main {
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) var(--sticker-peelback-active),
      calc(100% + var(--sticker-p)) var(--sticker-peelback-active),
      calc(100% + var(--sticker-p)) calc(100% + var(--sticker-p)),
      calc(-1 * var(--sticker-p)) calc(100% + var(--sticker-p))
    );
  }

  .sticker-image, .flap-image {
    width: var(--sticker-width, 200px);
  }

  .sticker-image {
    transform: rotate(var(--sticker-rotate));
  }

  .flap-image {
    transform: rotate(var(--sticker-rotate));
  }

  .flap {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: calc(-100% - var(--sticker-p) - var(--sticker-p));
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(-1 * var(--sticker-p)) calc(-1 * var(--sticker-p))
    );
    transform: scaleY(-1);
    transition: all 0.6s ease-out;
  }

  .flap > * {
    transform: rotate(calc(-1 * var(--peel-direction)));
  }

  .sticker-container:hover .flap,
  .sticker-container.touch-active .flap {
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) var(--sticker-peelback-hover),
      calc(-1 * var(--sticker-p)) var(--sticker-peelback-hover)
    );
    top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px);
  }

  .sticker-container:active .flap {
    clip-path: polygon(
      calc(-1 * var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) calc(-1 * var(--sticker-p)),
      calc(100% + var(--sticker-p)) var(--sticker-peelback-active),
      calc(-1 * var(--sticker-p)) var(--sticker-peelback-active)
    );
    top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px);
  }

  .sticker-main, .flap {
    will-change: clip-path, transform;
  }

  @media (hover: none) and (pointer: coarse) {
    .sticker-draggable { cursor: default; }
    .sticker-container { touch-action: none; }
  }
</style>
