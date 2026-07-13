<script setup lang="ts">
  import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      targetSelector?: string;
      spinDuration?: number;
      hideDefaultCursor?: boolean;
      hoverDuration?: number;
      class?: string;
    }>(),
    {
      targetSelector: '.cursor-target',
      spinDuration: 2,
      hideDefaultCursor: true,
      hoverDuration: 200,
      class: '',
    },
  );

  const hostRef = ref<HTMLElement | null>(null);
  const cursorPos = reactive({ x: 0, y: 0 });
  const smoothPos = reactive({ x: 0, y: 0 });
  const isHovering = ref(false);
  const isPressed = ref(false);
  const rotation = ref(0);
  const BORDER_WIDTH = 3;
  const CORNER_SIZE = 12;
  const LERP = 0.15;

  const cornerPositions = reactive([
    { x: -CORNER_SIZE * 1.5, y: -CORNER_SIZE * 1.5 },
    { x: CORNER_SIZE * 0.5, y: -CORNER_SIZE * 1.5 },
    { x: CORNER_SIZE * 0.5, y: CORNER_SIZE * 0.5 },
    { x: -CORNER_SIZE * 1.5, y: CORNER_SIZE * 0.5 },
  ]);

  const defaultCorners = [
    { x: -CORNER_SIZE * 1.5, y: -CORNER_SIZE * 1.5 },
    { x: CORNER_SIZE * 0.5, y: -CORNER_SIZE * 1.5 },
    { x: CORNER_SIZE * 0.5, y: CORNER_SIZE * 0.5 },
    { x: -CORNER_SIZE * 1.5, y: CORNER_SIZE * 0.5 },
  ];

  let animId = 0;
  let originalCursor = '';
  let activeTarget: Element | null = null;

  // Ref set on mount (not a computed) so SSR never touches window.
  const isMobile = ref(false);
  onMounted(() => {
    isMobile.value =
      ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 768;
  });

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function getLocalCoords(e: MouseEvent): { x: number; y: number } {
    const host = hostRef.value;
    if (!host) return { x: e.clientX, y: e.clientY };
    const rect = host.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function animate() {
    smoothPos.x = lerp(smoothPos.x, cursorPos.x, LERP);
    smoothPos.y = lerp(smoothPos.y, cursorPos.y, LERP);

    if (!isHovering.value) {
      rotation.value += 360 / (props.spinDuration * 60);
      if (rotation.value >= 360) rotation.value -= 360;
    }

    for (let i = 0; i < 4; i++) {
      if (!isHovering.value) {
        cornerPositions[i].x = lerp(
          cornerPositions[i].x,
          defaultCorners[i].x,
          0.1,
        );
        cornerPositions[i].y = lerp(
          cornerPositions[i].y,
          defaultCorners[i].y,
          0.1,
        );
      }
    }

    animId = requestAnimationFrame(animate);
  }

  function onPointerMove(e: MouseEvent) {
    const local = getLocalCoords(e);
    cursorPos.x = local.x;
    cursorPos.y = local.y;
  }

  function onMouseOver(e: Event) {
    const mouseEvent = e as MouseEvent;
    const directTarget = mouseEvent.target as Element;
    if (!directTarget) return;

    const host = hostRef.value;
    if (!host) return;

    let target: Element | null = directTarget;
    while (target && target !== host && target !== document.body) {
      if (target.matches(props.targetSelector)) break;
      target = target.parentElement;
    }
    if (!target || target === host || target === document.body) return;
    if (activeTarget === target) return;

    activeTarget = target;
    isHovering.value = true;
    rotation.value = 0;

    const hostRect = host.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const targetCorners = [
      {
        x: rect.left - hostRect.left - BORDER_WIDTH - smoothPos.x,
        y: rect.top - hostRect.top - BORDER_WIDTH - smoothPos.y,
      },
      {
        x:
          rect.right - hostRect.left + BORDER_WIDTH - CORNER_SIZE - smoothPos.x,
        y: rect.top - hostRect.top - BORDER_WIDTH - smoothPos.y,
      },
      {
        x:
          rect.right - hostRect.left + BORDER_WIDTH - CORNER_SIZE - smoothPos.x,
        y:
          rect.bottom - hostRect.top + BORDER_WIDTH - CORNER_SIZE - smoothPos.y,
      },
      {
        x: rect.left - hostRect.left - BORDER_WIDTH - smoothPos.x,
        y:
          rect.bottom - hostRect.top + BORDER_WIDTH - CORNER_SIZE - smoothPos.y,
      },
    ];

    for (let i = 0; i < 4; i++) {
      cornerPositions[i].x = targetCorners[i].x;
      cornerPositions[i].y = targetCorners[i].y;
    }

    const leaveHandler = () => {
      isHovering.value = false;
      activeTarget = null;
      target?.removeEventListener('mouseleave', leaveHandler);
    };
    target.addEventListener('mouseleave', leaveHandler);
  }

  onMounted(() => {
    if (isMobile.value) return;
    const host = hostRef.value;
    if (!host) return;

    originalCursor = host.style.cursor;
    if (props.hideDefaultCursor) host.style.cursor = 'none';

    const rect = host.getBoundingClientRect();
    smoothPos.x = rect.width / 2;
    smoothPos.y = rect.height / 2;
    cursorPos.x = smoothPos.x;
    cursorPos.y = smoothPos.y;
    animId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
    const host = hostRef.value;
    if (host) host.style.cursor = originalCursor;
  });
</script>

<template>
  <div
    v-if="!isMobile"
    ref="hostRef"
    :class="cn('target-cursor-host', $props.class)"
    @pointermove="onPointerMove"
    @mouseover="onMouseOver"
    @mousedown="isPressed = true"
    @mouseup="isPressed = false"
  >
    <slot></slot>
    <div
      class="target-cursor-wrapper"
      :style="{
        transform: `translate(${smoothPos.x}px, ${smoothPos.y}px) rotate(${rotation}deg) scale(${isPressed ? 0.9 : 1})`,
      }"
    >
      <div
        class="target-cursor-dot"
        :style="{
          transform: `translate(-50%, -50%) scale(${isPressed ? 0.7 : 1})`,
        }"
      ></div>
      <div
        v-for="(pos, i) in cornerPositions"
        :key="i"
        class="target-cursor-corner"
        :class="`corner-${['tl', 'tr', 'br', 'bl'][i]}`"
        :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
  .target-cursor-host {
    position: relative;
    contain: paint;
  }

  .target-cursor-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    will-change: transform;
  }

  .target-cursor-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4px;
    height: 4px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  .target-cursor-corner {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 12px;
    height: 12px;
    border: 3px solid #fff;
    will-change: transform;
  }

  .corner-tl {
    border-right: none;
    border-bottom: none;
  }

  .corner-tr {
    border-left: none;
    border-bottom: none;
  }

  .corner-br {
    border-left: none;
    border-top: none;
  }

  .corner-bl {
    border-right: none;
    border-top: none;
  }
</style>
