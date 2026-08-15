<script setup lang="ts">
  import { cn } from '~/lib/utils';

  defineProps<{
    class?: string;
  }>();

  const RECEIPT_TOOTH_COUNT = 40;
  const RECEIPT_TOOTH_DEPTH = 4;

  const receiptToothPoints = Array.from(
    { length: RECEIPT_TOOTH_COUNT * 2 },
    (_, index) => {
      const x = 100 - ((index + 1) * 100) / (RECEIPT_TOOTH_COUNT * 2);
      const y =
        index % 2 === 0 ? '100%' : `calc(100% - ${RECEIPT_TOOTH_DEPTH}px)`;
      return `${x}% ${y}`;
    },
  ).join(', ');

  const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${RECEIPT_TOOTH_DEPTH}px), ${receiptToothPoints})`;
</script>

<template>
  <article
    :style="{ clipPath: receiptClipPath }"
    :class="
      cn(
        'paper-surface relative z-10 min-h-80 bg-zinc-50 px-6 pt-7 pb-8 font-mono text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50',
        $props.class,
      )
    "
  >
    <slot />
  </article>
</template>

<style scoped>
  .paper-surface {
    background-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22360%22%20height%3D%22520%22%20viewBox%3D%220%200%20360%20520%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22paper%22%20x%3D%22-10%25%22%20y%3D%22-10%25%22%20width%3D%22120%25%22%20height%3D%22120%25%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.008%200.016%22%20numOctaves%3D%224%22%20seed%3D%2217%22%20stitchTiles%3D%22stitch%22%20result%3D%22coarse%22%20%2F%3E%3CfeDiffuseLighting%20in%3D%22coarse%22%20surfaceScale%3D%223.2%22%20diffuseConstant%3D%220.72%22%20lighting-color%3D%22%23ffffff%22%20result%3D%22coarse-light%22%3E%3CfeDistantLight%20azimuth%3D%22225%22%20elevation%3D%2255%22%20%2F%3E%3C%2FfeDiffuseLighting%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.09%200.12%22%20numOctaves%3D%222%22%20seed%3D%2231%22%20stitchTiles%3D%22stitch%22%20result%3D%22fine%22%20%2F%3E%3CfeDiffuseLighting%20in%3D%22fine%22%20surfaceScale%3D%220.55%22%20diffuseConstant%3D%220.55%22%20lighting-color%3D%22%23ffffff%22%20result%3D%22fine-light%22%3E%3CfeDistantLight%20azimuth%3D%22205%22%20elevation%3D%2265%22%20%2F%3E%3C%2FfeDiffuseLighting%3E%3CfeBlend%20in%3D%22coarse-light%22%20in2%3D%22fine-light%22%20mode%3D%22multiply%22%20result%3D%22combined%22%20%2F%3E%3CfeComponentTransfer%20in%3D%22combined%22%3E%3CfeFuncR%20type%3D%22linear%22%20slope%3D%220.42%22%20intercept%3D%220.29%22%20%2F%3E%3CfeFuncG%20type%3D%22linear%22%20slope%3D%220.42%22%20intercept%3D%220.29%22%20%2F%3E%3CfeFuncB%20type%3D%22linear%22%20slope%3D%220.42%22%20intercept%3D%220.29%22%20%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Crect%20width%3D%22360%22%20height%3D%22520%22%20fill%3D%22%23808080%22%20filter%3D%22url%28%23paper%29%22%20%2F%3E%3C%2Fsvg%3E');
    background-size: cover;
    background-blend-mode: soft-light;
  }
</style>
