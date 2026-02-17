<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      position?: 'top' | 'bottom' | 'left' | 'right';
      strength?: number;
      height?: string;
      divCount?: number;
      exponential?: boolean;
      opacity?: number;
      curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
      class?: string;
    }>(),
    {
      position: 'bottom',
      strength: 2,
      height: '6rem',
      divCount: 5,
      exponential: false,
      opacity: 1,
      curve: 'linear',
      class: '',
    },
  );

  const curveFns: Record<string, (p: number) => number> = {
    linear: (p: number) => p,
    bezier: (p: number) => p * p * (3 - 2 * p),
    'ease-in': (p: number) => p * p,
    'ease-out': (p: number) => 1 - (1 - p) ** 2,
    'ease-in-out': (p: number) =>
      p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2,
  };

  function getGradientDirection(pos: string): string {
    const map: Record<string, string> = {
      top: 'to top',
      bottom: 'to bottom',
      left: 'to left',
      right: 'to right',
    };
    return map[pos] || 'to bottom';
  }

  const blurDivs = computed(() => {
    const divs: Array<{ key: number; style: Record<string, string> }> = [];
    const increment = 100 / props.divCount;
    const curveFn = curveFns[props.curve] || curveFns.linear;
    const direction = getGradientDirection(props.position);

    for (let i = 1; i <= props.divCount; i++) {
      let progress = i / props.divCount;
      progress = curveFn(progress);

      const blurValue = props.exponential
        ? 2 ** (progress * 4) * 0.0625 * props.strength
        : 0.0625 * (progress * props.divCount + 1) * props.strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const maskImage = `linear-gradient(${direction}, ${gradient})`;
      const blur = `blur(${blurValue.toFixed(3)}rem)`;

      divs.push({
        key: i,
        style: {
          position: 'absolute',
          inset: '0',
          maskImage,
          WebkitMaskImage: maskImage,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          opacity: String(props.opacity),
        },
      });
    }
    return divs;
  });

  const containerStyle = computed(() => {
    const isVertical = ['top', 'bottom'].includes(props.position);
    const base: Record<string, string> = {
      position: 'absolute',
      pointerEvents: 'none',
    };

    if (isVertical) {
      base.height = props.height;
      base.width = '100%';
      base[props.position] = '0';
      base.left = '0';
      base.right = '0';
    } else {
      base.width = props.height;
      base.height = '100%';
      base[props.position] = '0';
      base.top = '0';
      base.bottom = '0';
    }
    return base;
  });
</script>

<template>
  <div :class="cn($props.class)" :style="containerStyle">
    <div class="relative size-full">
      <div v-for="div in blurDivs" :key="div.key" :style="div.style"></div>
    </div>
  </div>
</template>
