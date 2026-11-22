<script setup lang="ts">
  import { useId } from 'vue';
  import type { AuraSpeedTestRadarProps } from './types';

  const props = defineProps<AuraSpeedTestRadarProps>();

  const gradientId = `aura-sweep-${useId()}`;
  const BLIP_X = 144.4;
  const BLIP_Y = 62.7;
</script>

<template>
  <svg
    viewBox="0 0 200 200"
    class="absolute inset-0 block size-full overflow-visible"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="gradientId"
        x1="100"
        y1="15"
        x2="160"
        y2="60"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="currentColor" stop-opacity="0.32" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g class="aura-radar-sweep" :class="{ 'aura-radar-fast': props.testing }">
      <path
        d="M100 100 L100 15 A85 85 0 0 1 160.1 39.9 Z"
        :fill="`url(#${gradientId})`"
      />
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="15"
        stroke="currentColor"
        stroke-opacity="0.45"
        stroke-width="0.8"
      />
    </g>
    <circle
      cx="100"
      cy="100"
      r="85"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.22"
    />
    <circle
      cx="100"
      cy="100"
      r="58"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.32"
    />
    <circle
      cx="100"
      cy="100"
      r="30"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.55"
    />
    <circle
      v-if="props.testing"
      class="aura-radar-ping"
      cx="100"
      cy="100"
      r="85"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
    />
    <line
      x1="100"
      y1="100"
      :x2="BLIP_X"
      :y2="BLIP_Y"
      stroke="currentColor"
      stroke-opacity="0.8"
      stroke-width="1.4"
      stroke-dasharray="3 3"
    />
    <circle cx="100" cy="100" r="5" fill="currentColor" />
    <circle
      class="aura-radar-halo"
      :cx="BLIP_X"
      :cy="BLIP_Y"
      r="13"
      fill="currentColor"
      fill-opacity="0.22"
    />
    <circle :cx="BLIP_X" :cy="BLIP_Y" r="7.5" fill="currentColor" />
  </svg>
</template>

<style scoped>
  .aura-radar-sweep {
    transform-box: view-box;
    transform-origin: 50% 50%;
    animation: aura-radar-spin 5s linear infinite;
  }
  .aura-radar-fast {
    animation-duration: 1.8s;
  }
  .aura-radar-ping {
    transform-box: view-box;
    transform-origin: 50% 50%;
    animation: aura-radar-ping 1.8s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
  }
  .aura-radar-halo {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: aura-radar-halo 2.4s ease-in-out infinite;
  }
  @keyframes aura-radar-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes aura-radar-ping {
    from {
      transform: scale(0.08);
      opacity: 0.8;
    }
    to {
      transform: scale(1);
      opacity: 0;
    }
  }
  @keyframes aura-radar-halo {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.35);
      opacity: 0.5;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .aura-radar-sweep,
    .aura-radar-ping,
    .aura-radar-halo {
      animation: none;
    }
    .aura-radar-ping {
      display: none;
    }
  }
</style>
