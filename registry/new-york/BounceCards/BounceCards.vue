<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      images?: string[];
      containerWidth?: number;
      containerHeight?: number;
      animationDelay?: number;
      animationStagger?: number;
      transformStyles?: string[];
      enableHover?: boolean;
      class?: string;
    }>(),
    {
      images: () => [],
      containerWidth: 400,
      containerHeight: 400,
      animationDelay: 500,
      animationStagger: 60,
      transformStyles: () => [
        'rotate(10deg) translate(-170px)',
        'rotate(5deg) translate(-85px)',
        'rotate(-3deg)',
        'rotate(-10deg) translate(85px)',
        'rotate(2deg) translate(170px)',
      ],
      enableHover: true,
      class: '',
    },
  );

  const cardScales = ref<number[]>([]);
  const hoveredIdx = ref<number | null>(null);
  const isAnimated = ref(false);

  onMounted(() => {
    cardScales.value = props.images.map(() => 0);
    // Staggered entrance animation
    props.images.forEach((_, i) => {
      setTimeout(
        () => {
          cardScales.value[i] = 1;
        },
        props.animationDelay + i * props.animationStagger,
      );
    });
    setTimeout(
      () => {
        isAnimated.value = true;
      },
      props.animationDelay + props.images.length * props.animationStagger + 600,
    );
  });

  function getTranslateX(transform: string): number {
    const match = transform.match(/translate\(([-\d.]+)px\)/);
    return match ? Number.parseFloat(match[1]) : 0;
  }

  function getNoRotation(transform: string): string {
    if (/rotate\(/.test(transform)) {
      return transform.replace(/rotate\([^)]*\)/, 'rotate(0deg)');
    }
    return `${transform} rotate(0deg)`;
  }

  function getPushed(transform: string, offset: number): string {
    const match = transform.match(/translate\(([-\d.]+)px\)/);
    if (match) {
      const cur = Number.parseFloat(match[1]);
      return transform.replace(/translate\([^)]*\)/, `translate(${cur + offset}px)`);
    }
    return `${transform} translate(${offset}px)`;
  }

  function cardStyle(idx: number) {
    const base = props.transformStyles[idx] ?? 'none';
    let t = base;

    if (props.enableHover && hoveredIdx.value !== null) {
      if (idx === hoveredIdx.value) {
        t = getNoRotation(base);
      } else {
        const offset = idx < hoveredIdx.value ? -160 : 160;
        t = getPushed(base, offset);
      }
    }

    return {
      transform: `${t} scale(${cardScales.value[idx] ?? 0})`,
      transition: isAnimated.value ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  }
</script>

<template>
  <div
    :class="cn('relative flex items-center justify-center', $props.class)"
    :style="{ width: `${containerWidth}px`, height: `${containerHeight}px` }"
  >
    <div
      v-for="(src, idx) in images"
      :key="idx"
      class="absolute aspect-square w-[200px] overflow-hidden rounded-[25px] border-[5px] border-white shadow-lg"
      :style="cardStyle(idx)"
      @mouseenter="hoveredIdx = idx"
      @mouseleave="hoveredIdx = null"
    >
      <img :src="src" :alt="`card-${idx}`" class="size-full object-cover" />
    </div>
  </div>
</template>
