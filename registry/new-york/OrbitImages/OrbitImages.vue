<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface OrbitItem {
    src: string;
    alt?: string;
  }

  type OrbitShape =
    | 'ellipse'
    | 'circle'
    | 'square'
    | 'rectangle'
    | 'triangle'
    | 'star'
    | 'heart'
    | 'infinity'
    | 'wave';

  const props = withDefaults(
    defineProps<{
      images?: OrbitItem[];
      shape?: OrbitShape;
      baseWidth?: number;
      radiusX?: number;
      radiusY?: number;
      radius?: number;
      starPoints?: number;
      starInnerRatio?: number;
      rotation?: number;
      duration?: number;
      itemSize?: number;
      direction?: 'normal' | 'reverse';
      fill?: boolean;
      showPath?: boolean;
      pathColor?: string;
      pathWidth?: number;
      paused?: boolean;
      responsive?: boolean;
      class?: string;
    }>(),
    {
      images: () => [],
      shape: 'ellipse',
      baseWidth: 1400,
      radiusX: 700,
      radiusY: 170,
      radius: 300,
      starPoints: 5,
      starInnerRatio: 0.5,
      rotation: -8,
      duration: 40,
      itemSize: 64,
      direction: 'normal',
      fill: true,
      showPath: false,
      pathColor: 'rgba(0,0,0,0.1)',
      pathWidth: 2,
      paused: false,
      responsive: false,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const scale = ref(1);
  const progress = ref(0);
  let animId = 0;
  let lastTime = 0;

  // Shape generators
  function generateEllipsePath(cx: number, cy: number, rx: number, ry: number): string {
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }

  function generateCirclePath(cx: number, cy: number, r: number): string {
    return generateEllipsePath(cx, cy, r, r);
  }

  function generateSquarePath(cx: number, cy: number, size: number): string {
    const h = size / 2;
    return `M ${cx - h} ${cy - h} L ${cx + h} ${cy - h} L ${cx + h} ${cy + h} L ${cx - h} ${cy + h} Z`;
  }

  function generateRectanglePath(cx: number, cy: number, w: number, h: number): string {
    const hw = w / 2;
    const hh = h / 2;
    return `M ${cx - hw} ${cy - hh} L ${cx + hw} ${cy - hh} L ${cx + hw} ${cy + hh} L ${cx - hw} ${cy + hh} Z`;
  }

  function generateTrianglePath(cx: number, cy: number, size: number): string {
    const height = (size * Math.sqrt(3)) / 2;
    const hs = size / 2;
    return `M ${cx} ${cy - height / 1.5} L ${cx + hs} ${cy + height / 3} L ${cx - hs} ${cy + height / 3} Z`;
  }

  function generateStarPath(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
    const step = Math.PI / points;
    let path = '';
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return `${path} Z`;
  }

  function generateHeartPath(cx: number, cy: number, size: number): string {
    const s = size / 30;
    return `M ${cx} ${cy + 12 * s} C ${cx - 20 * s} ${cy - 5 * s}, ${cx - 12 * s} ${cy - 18 * s}, ${cx} ${cy - 8 * s} C ${cx + 12 * s} ${cy - 18 * s}, ${cx + 20 * s} ${cy - 5 * s}, ${cx} ${cy + 12 * s}`;
  }

  function generateInfinityPath(cx: number, cy: number, w: number, h: number): string {
    const hw = w / 2;
    const hh = h / 2;
    return `M ${cx} ${cy} C ${cx + hw * 0.5} ${cy - hh}, ${cx + hw} ${cy - hh}, ${cx + hw} ${cy} C ${cx + hw} ${cy + hh}, ${cx + hw * 0.5} ${cy + hh}, ${cx} ${cy} C ${cx - hw * 0.5} ${cy + hh}, ${cx - hw} ${cy + hh}, ${cx - hw} ${cy} C ${cx - hw} ${cy - hh}, ${cx - hw * 0.5} ${cy - hh}, ${cx} ${cy}`;
  }

  function generateWavePath(cx: number, cy: number, w: number, amplitude: number, waves: number): string {
    const pts: string[] = [];
    const segs = waves * 20;
    const hw = w / 2;
    for (let i = 0; i <= segs; i++) {
      const x = cx - hw + (w * i) / segs;
      const y = cy + Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
      pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    for (let i = segs; i >= 0; i--) {
      const x = cx - hw + (w * i) / segs;
      const y = cy - Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
      pts.push(`L ${x} ${y}`);
    }
    return `${pts.join(' ')} Z`;
  }

  const designCenterX = computed(() => props.baseWidth / 2);
  const designCenterY = computed(() => props.baseWidth / 2);

  const path = computed(() => {
    const cx = designCenterX.value;
    const cy = designCenterY.value;
    switch (props.shape) {
      case 'circle':
        return generateCirclePath(cx, cy, props.radius);
      case 'square':
        return generateSquarePath(cx, cy, props.radius * 2);
      case 'rectangle':
        return generateRectanglePath(cx, cy, props.radiusX * 2, props.radiusY * 2);
      case 'triangle':
        return generateTrianglePath(cx, cy, props.radius * 2);
      case 'star':
        return generateStarPath(cx, cy, props.radius, props.radius * props.starInnerRatio, props.starPoints);
      case 'heart':
        return generateHeartPath(cx, cy, props.radius * 2);
      case 'infinity':
        return generateInfinityPath(cx, cy, props.radiusX * 2, props.radiusY * 2);
      case 'wave':
        return generateWavePath(cx, cy, props.radiusX * 2, props.radiusY, 3);
      default:
        return generateEllipsePath(cx, cy, props.radiusX, props.radiusY);
    }
  });

  function getItemOffset(index: number): string {
    if (!props.fill) return `${progress.value}%`;
    const itemOffset = (index / props.images.length) * 100;
    const offset = (((progress.value + itemOffset) % 100) + 100) % 100;
    return `${offset}%`;
  }

  // Responsive scaling
  if (props.responsive) {
    useResizeObserver(containerRef, (entries) => {
      const entry = entries[0];
      if (entry) {
        scale.value = entry.contentRect.width / props.baseWidth;
      }
    });
  }

  function animate(time: number) {
    if (props.paused) {
      lastTime = time;
      animId = requestAnimationFrame(animate);
      return;
    }

    if (lastTime === 0) lastTime = time;
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    const speed = (100 / props.duration) * delta;
    progress.value =
      ((progress.value + (props.direction === 'reverse' ? -speed : speed)) % 100 + 100) % 100;

    animId = requestAnimationFrame(animate);
  }

  onMounted(() => {
    animId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('orbit-container relative mx-auto', props.class)"
    :style="{
      width: responsive ? '100%' : undefined,
      aspectRatio: responsive ? '1 / 1' : undefined,
    }"
    aria-hidden="true"
  >
    <div
      :class="responsive ? 'orbit-scaling absolute left-1/2 top-1/2 origin-center' : 'relative size-full'"
      :style="{
        width: responsive ? `${baseWidth}px` : '100%',
        height: responsive ? `${baseWidth}px` : '100%',
        transform: responsive ? `translate(-50%, -50%) scale(${scale})` : undefined,
      }"
    >
      <div
        class="orbit-rotation size-full origin-center relative"
        :style="{ transform: `rotate(${rotation}deg)` }"
      >
        <svg
          v-if="showPath"
          width="100%"
          height="100%"
          :viewBox="`0 0 ${baseWidth} ${baseWidth}`"
          class="absolute inset-0 pointer-events-none"
        >
          <path :d="path" fill="none" :stroke="pathColor" :stroke-width="pathWidth / scale" />
        </svg>

        <div
          v-for="(image, index) in images"
          :key="index"
          class="orbit-item absolute will-change-transform select-none"
          :style="{
            width: `${itemSize}px`,
            height: `${itemSize}px`,
            offsetPath: `path('${path}')`,
            offsetRotate: '0deg',
            offsetAnchor: 'center center',
            offsetDistance: getItemOffset(index),
          }"
        >
          <div :style="{ transform: `rotate(${-rotation}deg)` }">
            <img
              :src="image.src"
              :alt="image.alt || ''"
              class="size-full rounded-sm object-cover"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="absolute inset-0 z-10 flex items-center justify-center">
      <slot></slot>
    </div>
  </div>
</template>
