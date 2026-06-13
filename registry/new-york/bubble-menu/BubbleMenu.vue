<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { cn } from '~/lib/utils';

  interface BubbleMenuItem {
    label: string;
    href?: string;
    ariaLabel?: string;
    rotation?: number;
    hoverBgColor?: string;
    hoverTextColor?: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: BubbleMenuItem[];
      menuBg?: string;
      menuContentColor?: string;
      animationDuration?: number;
      staggerDelay?: number;
      class?: string;
    }>(),
    {
      items: () => [
        {
          label: 'home',
          href: '#',
          rotation: -8,
          hoverBgColor: '#3b82f6',
          hoverTextColor: '#fff',
        },
        {
          label: 'about',
          href: '#',
          rotation: 8,
          hoverBgColor: '#10b981',
          hoverTextColor: '#fff',
        },
        {
          label: 'projects',
          href: '#',
          rotation: 8,
          hoverBgColor: '#f59e0b',
          hoverTextColor: '#fff',
        },
        {
          label: 'blog',
          href: '#',
          rotation: 8,
          hoverBgColor: '#ef4444',
          hoverTextColor: '#fff',
        },
        {
          label: 'contact',
          href: '#',
          rotation: -8,
          hoverBgColor: '#8b5cf6',
          hoverTextColor: '#fff',
        },
      ],
      menuBg: '#ffffff',
      menuContentColor: '#111111',
      animationDuration: 500,
      staggerDelay: 80,
      class: '',
    },
  );

  const isOpen = ref(false);

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  const pillStyle = computed(() => (item: BubbleMenuItem, index: number) => ({
    '--item-rot': `${item.rotation ?? 0}deg`,
    '--pill-bg': props.menuBg,
    '--pill-color': props.menuContentColor,
    '--hover-bg': item.hoverBgColor || '#f3f4f6',
    '--hover-color': item.hoverTextColor || props.menuContentColor,
    '--stagger': `${index * props.staggerDelay}ms`,
    '--duration': `${props.animationDuration}ms`,
  }));
</script>

<template>
  <div :class="cn('relative size-full', $props.class)">
    <!-- Top bar: logo + hamburger -->
    <nav
      class="absolute inset-x-0 top-4 z-99 flex items-center justify-between px-8 pointer-events-none"
    >
      <div
        class="pointer-events-auto inline-flex h-14 items-center rounded-full px-4 shadow-lg"
        :style="{ background: menuBg }"
      >
        <span
          class="inline-flex w-30 items-center justify-center text-sm font-semibold"
          :style="{ color: menuContentColor }"
        >
          <slot name="logo">Logo</slot>
        </span>
      </div>
      <button
        type="button"
        class="pointer-events-auto flex size-14 cursor-pointer flex-col items-center justify-center rounded-full shadow-lg"
        :style="{ background: menuBg }"
        :aria-pressed="isOpen"
        aria-label="Toggle menu"
        @click="toggle"
      >
        <span
          class="block h-0.5 w-6.5 rounded-full transition-transform duration-300"
          :class="isOpen ? 'translate-y-1 rotate-45' : ''"
          :style="{ background: menuContentColor }"
        ></span>
        <span
          class="mt-1.5 block h-0.5 w-4.5 rounded-full transition-transform duration-300"
          :class="isOpen ? '-translate-y-1 -rotate-45 w-6.5!' : ''"
          :style="{ background: menuContentColor }"
        ></span>
      </button>
    </nav>

    <!-- Overlay with pill items -->
    <div
      v-if="isOpen"
      class="absolute inset-0 z-98 flex items-center justify-center"
    >
      <ul
        class="m-0 flex w-full max-w-400 list-none flex-wrap justify-stretch gap-y-1 px-6"
      >
        <li
          v-for="(item, i) in items"
          :key="i"
          class="flex flex-[0_0_calc(100%/3)] items-stretch justify-center"
          :class="[
            items.length === 4 && i === 3 ? 'ml-[calc(100%/3)]' : '',
            items.length === 5 && i >= 3 ? 'ml-[calc(100%/6)]' : '',
          ]"
        >
          <a
            :href="item.href || '#'"
            :aria-label="item.ariaLabel || item.label"
            class="bubble-pill"
            :style="pillStyle(item, i)"
          >
            <span
              class="bubble-pill-label"
              :class="isOpen ? 'bubble-pill-label--visible' : ''"
            >
              {{ item.label }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .bubble-pill {
    width: 100%;
    min-height: 160px;
    padding: clamp(1.5rem, 3vw, 8rem) 0;
    font-size: clamp(1.5rem, 4vw, 4rem);
    font-weight: 400;
    line-height: 0;
    border-radius: 999px;
    background: var(--pill-bg);
    color: var(--pill-color);
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0) rotate(var(--item-rot));
    animation: bubble-in var(--duration) cubic-bezier(0.34, 1.56, 0.64, 1)
      var(--stagger) forwards;
    transition:
      background 0.3s ease,
      color 0.3s ease,
      transform 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
  }

  .bubble-pill:hover {
    transform: rotate(var(--item-rot)) scale(1.06);
    background: var(--hover-bg);
    color: var(--hover-color);
  }

  .bubble-pill:active {
    transform: rotate(var(--item-rot)) scale(0.94);
  }

  @keyframes bubble-in {
    to {
      transform: scale(1) rotate(var(--item-rot));
    }
  }

  .bubble-pill-label {
    display: inline-block;
    height: 1.2em;
    line-height: 1.2;
    opacity: 0;
    transform: translateY(24px);
  }

  .bubble-pill-label--visible {
    animation: label-in 0.4s ease-out var(--stagger) forwards;
  }

  @keyframes label-in {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 899px) {
    .bubble-pill {
      font-size: clamp(1.2rem, 3vw, 4rem);
      padding: clamp(1rem, 2vw, 2rem) 0;
      min-height: 80px;
      transform: scale(0);
    }
  }
</style>
