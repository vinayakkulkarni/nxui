<script setup lang="ts">
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      color?: string;
      speed?: string;
      thickness?: number;
      class?: string;
    }>(),
    {
      color: 'white',
      speed: '6s',
      thickness: 1,
      class: '',
    },
  );
</script>

<template>
  <div
    :class="cn('star-border-container', $props.class)"
    :style="{ padding: `${thickness}px 0` }"
  >
    <div
      class="star-border-gradient-bottom"
      :style="{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed,
      }"
    />
    <div
      class="star-border-gradient-top"
      :style="{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animationDuration: speed,
      }"
    />
    <div class="star-border-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .star-border-container {
    display: inline-block;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
  }

  .star-border-gradient-bottom {
    position: absolute;
    width: 300%;
    height: 50%;
    opacity: 0.7;
    bottom: -12px;
    right: -250%;
    border-radius: 50%;
    animation: star-move-bottom linear infinite alternate;
    z-index: 0;
  }

  .star-border-gradient-top {
    position: absolute;
    width: 300%;
    height: 50%;
    opacity: 0.7;
    top: -12px;
    left: -250%;
    border-radius: 50%;
    animation: star-move-top linear infinite alternate;
    z-index: 0;
  }

  .star-border-inner {
    position: relative;
    border: 1px solid oklch(0.3 0 0);
    background: oklch(0.13 0.004 270);
    color: white;
    font-size: 16px;
    text-align: center;
    padding: 16px 26px;
    border-radius: 20px;
    z-index: 1;
  }

  @keyframes star-move-bottom {
    0% {
      transform: translate(0%, 0%);
      opacity: 1;
    }
    100% {
      transform: translate(-100%, 0%);
      opacity: 0;
    }
  }

  @keyframes star-move-top {
    0% {
      transform: translate(0%, 0%);
      opacity: 1;
    }
    100% {
      transform: translate(100%, 0%);
      opacity: 0;
    }
  }
</style>
