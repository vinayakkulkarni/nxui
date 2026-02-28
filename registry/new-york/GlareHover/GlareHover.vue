<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      width?: string;
      height?: string;
      background?: string;
      borderRadius?: string;
      borderColor?: string;
      glareColor?: string;
      glareOpacity?: number;
      glareAngle?: number;
      glareSize?: number;
      transitionDuration?: number;
      playOnce?: boolean;
      class?: string;
    }>(),
    {
      width: '500px',
      height: '500px',
      background: '#000',
      borderRadius: '10px',
      borderColor: '#333',
      glareColor: '#ffffff',
      glareOpacity: 0.5,
      glareAngle: -45,
      glareSize: 250,
      transitionDuration: 650,
      playOnce: false,
      class: '',
    },
  );

  const rgba = computed(() => {
    const hex = props.glareColor.replace('#', '');
    if (/^[0-9A-F]{6}$/i.test(hex)) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${props.glareOpacity})`;
    }
    if (/^[0-9A-F]{3}$/i.test(hex)) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${props.glareOpacity})`;
    }
    return props.glareColor;
  });

  const cssVars = computed(() => ({
    '--gh-width': props.width,
    '--gh-height': props.height,
    '--gh-bg': props.background,
    '--gh-br': props.borderRadius,
    '--gh-angle': `${props.glareAngle}deg`,
    '--gh-duration': `${props.transitionDuration}ms`,
    '--gh-size': `${props.glareSize}%`,
    '--gh-rgba': rgba.value,
    '--gh-border': props.borderColor,
  }));
</script>

<template>
  <div
    :class="
      cn(
        'glare-hover-wrap',
        playOnce ? 'glare-hover--play-once' : '',
        $props.class,
      )
    "
    :style="cssVars"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
  .glare-hover-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: var(--gh-width);
    height: var(--gh-height);
    background: var(--gh-bg);
    border-radius: var(--gh-br);
    border: 1px solid var(--gh-border);
    overflow: hidden;
  }

  .glare-hover-wrap:hover {
    cursor: pointer;
  }

  .glare-hover-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--gh-angle),
      hsla(0, 0%, 0%, 0) 60%,
      var(--gh-rgba) 70%,
      hsla(0, 0%, 0%, 0),
      hsla(0, 0%, 0%, 0) 100%
    );
    transition: var(--gh-duration) ease;
    background-size:
      var(--gh-size) var(--gh-size),
      100% 100%;
    background-repeat: no-repeat;
    background-position:
      -100% -100%,
      0 0;
  }

  .glare-hover-wrap:hover::before {
    background-position:
      100% 100%,
      0 0;
  }

  .glare-hover--play-once::before {
    transition: none;
  }

  .glare-hover--play-once:hover::before {
    transition: var(--gh-duration) ease;
    background-position:
      100% 100%,
      0 0;
  }
</style>
