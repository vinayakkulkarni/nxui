<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      gridSize?: number;
      cubeSize?: number;
      maxAngle?: number;
      radius?: number;
      speed?: number;
      borderStyle?: string;
      faceColor?: string;
      autoAnimate?: boolean;
      class?: string;
    }>(),
    {
      gridSize: 10,
      cubeSize: undefined,
      maxAngle: 45,
      radius: 3,
      speed: 0.02,
      borderStyle: '1px solid #fff',
      faceColor: '#060010',
      autoAnimate: true,
      class: '',
    },
  );

  const sceneRef = ref<HTMLDivElement>();
  const cubeRotations = ref<{ x: number; y: number }[]>([]);
  let animationId = 0;
  let userActive = false;
  let idleTimer = 0;
  const simPos = { x: 0, y: 0 };
  const simTarget = { x: 0, y: 0 };

  const totalCells = computed(() => props.gridSize * props.gridSize);

  onMounted(() => {
    const rots: { x: number; y: number }[] = [];
    for (let i = 0; i < totalCells.value; i++) {
      rots.push({ x: 0, y: 0 });
    }
    cubeRotations.value = rots;

    simPos.x = Math.random() * props.gridSize;
    simPos.y = Math.random() * props.gridSize;
    simTarget.x = Math.random() * props.gridSize;
    simTarget.y = Math.random() * props.gridSize;

    // Target rotations for smooth lerping
    const targetRots: { x: number; y: number }[] = rots.map(() => ({
      x: 0,
      y: 0,
    }));

    function tiltAt(rowCenter: number, colCenter: number) {
      for (let r = 0; r < props.gridSize; r++) {
        for (let c = 0; c < props.gridSize; c++) {
          const idx = r * props.gridSize + c;
          const dist = Math.hypot(r - rowCenter, c - colCenter);
          if (dist <= props.radius) {
            const pct = 1 - dist / props.radius;
            const angle = pct * props.maxAngle;
            targetRots[idx] = { x: -angle, y: angle };
          } else {
            targetRots[idx] = { x: 0, y: 0 };
          }
        }
      }
    }

    function update() {
      animationId = requestAnimationFrame(update);

      if (props.autoAnimate && !userActive) {
        simPos.x += (simTarget.x - simPos.x) * props.speed;
        simPos.y += (simTarget.y - simPos.y) * props.speed;
        tiltAt(simPos.y, simPos.x);
        if (Math.hypot(simPos.x - simTarget.x, simPos.y - simTarget.y) < 0.1) {
          simTarget.x = Math.random() * props.gridSize;
          simTarget.y = Math.random() * props.gridSize;
        }
      }

      // Lerp current toward target
      const lerpFactor = 0.15;
      for (let i = 0; i < cubeRotations.value.length; i++) {
        cubeRotations.value[i].x +=
          (targetRots[i].x - cubeRotations.value[i].x) * lerpFactor;
        cubeRotations.value[i].y +=
          (targetRots[i].y - cubeRotations.value[i].y) * lerpFactor;
      }
    }
    animationId = requestAnimationFrame(update);

    useEventListener(sceneRef, 'pointermove', (e: PointerEvent) => {
      userActive = true;
      clearTimeout(idleTimer);
      const scene = sceneRef.value;
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const cellW = rect.width / props.gridSize;
      const cellH = rect.height / props.gridSize;
      tiltAt((e.clientY - rect.top) / cellH, (e.clientX - rect.left) / cellW);
      idleTimer = window.setTimeout(() => {
        userActive = false;
      }, 3000);
    });

    useEventListener(sceneRef, 'pointerleave', () => {
      for (let i = 0; i < targetRots.length; i++) {
        targetRots[i] = { x: 0, y: 0 };
      }
    });
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    clearTimeout(idleTimer);
  });

  const sceneStyle = computed(() => ({
    gridTemplateColumns: props.cubeSize
      ? `repeat(${props.gridSize}, ${props.cubeSize}px)`
      : `repeat(${props.gridSize}, 1fr)`,
    gridTemplateRows: props.cubeSize
      ? `repeat(${props.gridSize}, ${props.cubeSize}px)`
      : `repeat(${props.gridSize}, 1fr)`,
    columnGap: '5%',
    rowGap: '5%',
  }));
</script>

<template>
  <div
    :class="cn('cubes-wrap', $props.class)"
    :style="{
      '--cube-face-border': borderStyle,
      '--cube-face-bg': faceColor,
      width: cubeSize ? `${gridSize * cubeSize}px` : '100%',
      aspectRatio: '1 / 1',
    }"
  >
    <div ref="sceneRef" class="cubes-scene" :style="sceneStyle">
      <div
        v-for="(rot, idx) in cubeRotations"
        :key="idx"
        class="cube"
        :style="{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }"
      >
        <div class="cube-face cube-face--top"></div>
        <div class="cube-face cube-face--bottom"></div>
        <div class="cube-face cube-face--left"></div>
        <div class="cube-face cube-face--right"></div>
        <div class="cube-face cube-face--front"></div>
        <div class="cube-face cube-face--back"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .cubes-wrap {
    position: relative;
  }

  .cubes-scene {
    display: grid;
    width: 100%;
    height: 100%;
    perspective: 99999999px;
  }

  .cube {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .cube-face {
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--cube-face-bg);
    border: var(--cube-face-border);
  }

  .cube-face--top {
    transform: translateY(-50%) rotateX(90deg);
  }

  .cube-face--bottom {
    transform: translateY(50%) rotateX(-90deg);
  }

  .cube-face--left {
    transform: translateX(-50%) rotateY(-90deg);
  }

  .cube-face--right {
    transform: translateX(50%) rotateY(90deg);
  }

  .cube-face--front,
  .cube-face--back {
    transform: rotateY(-90deg) translateX(50%) rotateY(90deg);
  }
</style>
