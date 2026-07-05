<script setup lang="ts">
  // Dynamic-island inspired header: a full navbar that collapses into a
  // compact pill on scroll, showing the active section and reading progress.
  // Inspired by the "dynamic island inspired header" by @YonathanDejene.
  import { ref, computed } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { DynamicIslandHeaderProps } from './types';

  const props = withDefaults(defineProps<DynamicIslandHeaderProps>(), {
    threshold: 80,
    compactWidth: 260,
    defaultLabel: 'Overview',
    signInLabel: 'Sign in',
    ctaLabel: 'Start free trial',
    container: null,
    class: '',
  });

  const emit = defineEmits<{
    navigate: [href: string];
  }>();

  const scrollY = ref(0);
  const progress = ref(0);
  const activeLabel = ref(props.defaultLabel);

  const compact = computed(() => scrollY.value > props.threshold);

  function scrollRoot(): HTMLElement | null {
    return props.container ?? null;
  }

  function onScroll() {
    const el = scrollRoot();
    const top = el ? el.scrollTop : window.scrollY;
    const height = el
      ? el.scrollHeight - el.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    scrollY.value = top;
    progress.value = height > 0 ? Math.min(top / height, 1) : 0;

    // Resolve the section currently in view from link anchors.
    const doc = el ?? document;
    let label = props.defaultLabel;
    for (const link of props.links) {
      if (!link.href.startsWith('#')) continue;
      const section = doc.querySelector<HTMLElement>(link.href);
      if (!section) continue;
      const rect = section.getBoundingClientRect();
      const containerTop = el ? el.getBoundingClientRect().top : 0;
      if (rect.top - containerTop <= 120) label = link.label;
    }
    activeLabel.value = label;
  }

  useEventListener(() => props.container ?? window, 'scroll', onScroll, {
    passive: true,
  });

  const RING_R = 8;
  const RING_C = 2 * Math.PI * RING_R;

  const spring = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 32,
  };
</script>

<template>
  <component
    :is="motion.header"
    :class="
      cn(
        'flex items-center overflow-hidden bg-neutral-900 text-neutral-100 shadow-lg shadow-black/10 dark:bg-neutral-950',
        compact ? 'justify-between px-4' : 'justify-between px-5',
        props.class,
      )
    "
    :initial="false"
    :animate="{
      width: compact ? `${compactWidth}px` : '100%',
      height: compact ? '52px' : '64px',
      borderRadius: compact ? '26px' : '32px',
    }"
    :transition="spring"
  >
    <!-- Logo -->
    <button
      type="button"
      class="flex shrink-0 cursor-pointer items-center gap-2"
      aria-label="Scroll to top"
      @click="emit('navigate', '#top')"
    >
      <slot name="logo">
        <Icon name="lucide:infinity" class="size-6 text-white" />
      </slot>
      <AnimatePresence>
        <component
          :is="motion.span"
          v-if="!compact"
          class="font-bold whitespace-nowrap text-white"
          :initial="{ opacity: 0, width: 0 }"
          :animate="{ opacity: 1, width: 'auto' }"
          :exit="{ opacity: 0, width: 0 }"
          :transition="{ duration: 0.2 }"
        >
          <slot name="brand">straton</slot>
        </component>
      </AnimatePresence>
    </button>

    <!-- Expanded: nav links -->
    <AnimatePresence mode="wait">
      <component
        :is="motion.nav"
        v-if="!compact"
        key="nav"
        class="flex min-w-0 items-center gap-6"
        :initial="{ opacity: 0, y: 6 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
        :transition="{ duration: 0.22 }"
      >
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="truncate text-sm text-neutral-400 transition-colors hover:text-white"
          @click="emit('navigate', link.href)"
        >
          {{ link.label }}
        </a>
      </component>

      <!-- Compact: active section label + progress ring -->
      <component
        :is="motion.div"
        v-else
        key="island"
        class="flex min-w-0 flex-1 items-center justify-between gap-3 pl-2"
        :initial="{ opacity: 0, y: 6 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
        :transition="{ duration: 0.22 }"
      >
        <AnimatePresence mode="wait">
          <component
            :is="motion.span"
            :key="activeLabel"
            class="truncate text-sm font-medium text-neutral-200"
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -8 }"
            :transition="{ duration: 0.18 }"
          >
            {{ activeLabel }}
          </component>
        </AnimatePresence>

        <svg
          class="size-5 shrink-0 -rotate-90"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <circle
            cx="10"
            cy="10"
            :r="RING_R"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="text-neutral-700"
          />
          <circle
            cx="10"
            cy="10"
            :r="RING_R"
            fill="none"
            stroke="#f97316"
            stroke-width="2.5"
            stroke-linecap="round"
            :stroke-dasharray="RING_C"
            :stroke-dashoffset="RING_C * (1 - progress)"
            class="transition-[stroke-dashoffset] duration-150"
          />
        </svg>
      </component>
    </AnimatePresence>

    <!-- Expanded: auth actions -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="!compact && (signInLabel || ctaLabel)"
        class="flex shrink-0 items-center gap-3"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.18 }"
      >
        <button
          v-if="signInLabel"
          type="button"
          class="cursor-pointer text-sm font-medium whitespace-nowrap text-white"
          @click="emit('navigate', '#sign-in')"
        >
          {{ signInLabel }}
        </button>
        <button
          v-if="ctaLabel"
          type="button"
          class="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 transition-transform hover:scale-105"
          @click="emit('navigate', '#cta')"
        >
          {{ ctaLabel }}
        </button>
      </component>
    </AnimatePresence>
  </component>
</template>
