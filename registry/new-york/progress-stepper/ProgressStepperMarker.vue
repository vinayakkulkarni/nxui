<script setup lang="ts">
  import { computed } from 'vue';
  import type { ProgressStepperMarkerProps } from './types';

  const props = withDefaults(defineProps<ProgressStepperMarkerProps>(), {
    size: 'lg',
  });

  const px = computed(() => (props.size === 'lg' ? 26 : 17));
</script>

<template>
  <span
    aria-hidden="true"
    class="relative grid shrink-0 place-items-center rounded-full bg-background"
    :style="{ width: `${px}px`, height: `${px}px` }"
  >
    <svg viewBox="0 0 24 24" class="size-full overflow-visible">
      <!-- Pending and active share the dashed track. -->
      <circle
        cx="12"
        cy="12"
        r="10.5"
        fill="none"
        :stroke-width="props.size === 'lg' ? 1.1 : 1.4"
        stroke-dasharray="2.6 2.4"
        class="stroke-muted-foreground/45 transition-opacity duration-300"
        :class="props.status === 'complete' ? 'opacity-0' : 'opacity-100'"
      />
      <g
        class="marker-spin origin-center transition-opacity duration-300"
        :class="props.status === 'active' ? 'opacity-100' : 'opacity-0'"
      >
        <circle
          cx="12"
          cy="12"
          r="10.5"
          fill="none"
          :stroke-width="props.size === 'lg' ? 1.6 : 1.9"
          stroke-linecap="round"
          pathLength="100"
          stroke-dasharray="30 70"
          class="stroke-blue-500"
        />
      </g>
      <g
        class="transition-opacity duration-300"
        :class="props.status === 'complete' ? 'opacity-100' : 'opacity-0'"
      >
        <circle
          cx="12"
          cy="12"
          r="10.5"
          fill="none"
          :stroke-width="props.size === 'lg' ? 1.3 : 1.7"
          class="stroke-emerald-500"
        />
        <path
          d="M7.6 12.3l3 2.9 5.8-6.2"
          fill="none"
          :stroke-width="props.size === 'lg' ? 1.6 : 2"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength="1"
          stroke-dasharray="1"
          class="marker-check stroke-emerald-500"
          :style="{ strokeDashoffset: props.status === 'complete' ? 0 : 1 }"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
  .marker-spin {
    transform-box: view-box;
    animation: marker-spin 1.1s linear infinite;
  }

  .marker-check {
    transition: stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.35, 1) 0.15s;
  }

  @keyframes marker-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .marker-spin {
      animation: none;
    }

    .marker-check {
      transition: none;
    }
  }
</style>
