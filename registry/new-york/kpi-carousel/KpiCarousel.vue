<script setup lang="ts">
  import { computed, ref, useTemplateRef } from 'vue';
  import {
    useElementHover,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import type { KpiCarouselProps, KpiTone, KpiToneStyle } from './types';

  const props = withDefaults(defineProps<KpiCarouselProps>(), {
    interval: 5000,
    ariaLabel: 'Key metrics',
    class: '',
  });

  const active = defineModel<number>({ default: 0 });

  const root = useTemplateRef<HTMLElement>('root');
  const hovered = useElementHover(root);
  const focused = ref(false);
  const motion = usePreferredReducedMotion();

  const count = computed(() => props.items.length);

  function go(index: number): void {
    if (count.value === 0) return;
    active.value = (index + count.value) % count.value;
  }

  function next(): void {
    go(active.value + 1);
  }

  function previous(): void {
    go(active.value - 1);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
  }

  // Autoplay pauses while the pointer or keyboard focus is inside.
  useIntervalFn(
    () => {
      if (props.interval > 0 && !hovered.value && !focused.value) next();
    },
    () => Math.max(1000, props.interval || 1000),
  );

  const TONES: Record<KpiTone, KpiToneStyle> = {
    best: {
      badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
      label: 'Best',
      icon: 'lucide:trophy',
      glow: 'from-emerald-500/14',
    },
    worst: {
      badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
      label: 'Needs attention',
      icon: 'lucide:triangle-alert',
      glow: 'from-rose-500/14',
    },
    neutral: {
      badge: 'bg-muted text-muted-foreground',
      label: 'Steady',
      icon: 'lucide:activity',
      glow: 'from-foreground/6',
    },
  };

  const trackStyle = computed(() => ({
    transform: `translateX(-${active.value * 100}%)`,
    transition:
      motion.value === 'reduce'
        ? 'none'
        : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
  }));

  function setFocused(value: boolean): void {
    focused.value = value;
  }
</script>

<template>
  <section
    ref="root"
    :class="['w-full', props.class]"
    role="region"
    aria-roledescription="carousel"
    :aria-label="props.ariaLabel"
    @focusin="setFocused(true)"
    @focusout="setFocused(false)"
    @keydown="onKeydown"
  >
    <div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div class="flex" :style="trackStyle">
        <article
          v-for="(item, index) in props.items"
          :key="item.title"
          class="relative w-full shrink-0 overflow-hidden p-6"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${count}: ${item.title}`"
          :aria-hidden="index !== active"
        >
          <div
            :class="[
              'pointer-events-none absolute inset-0 bg-radial-[at_100%_0%] to-transparent to-70%',
              TONES[item.tone].glow,
            ]"
          />
          <div class="relative flex flex-col gap-4">
            <span
              :class="[
                'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                TONES[item.tone].badge,
              ]"
            >
              <Icon :name="TONES[item.tone].icon" class="size-3.5" />
              {{ TONES[item.tone].label }}
            </span>
            <div>
              <p class="text-sm text-muted-foreground">{{ item.title }}</p>
              <p
                class="mt-1 text-4xl font-semibold tracking-tight tabular-nums"
              >
                {{ item.value }}
              </p>
            </div>
            <p class="text-sm text-muted-foreground">{{ item.caption }}</p>
          </div>
        </article>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <button
          v-for="(item, index) in props.items"
          :key="item.title"
          type="button"
          :aria-label="`Show ${item.title}`"
          :aria-current="index === active"
          :class="[
            'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            index === active
              ? 'w-6 bg-foreground'
              : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground',
          ]"
          @click="go(index)"
        />
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          aria-label="Previous metric"
          class="flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          @click="previous"
        >
          <Icon name="lucide:chevron-left" class="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next metric"
          class="flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          @click="next"
        >
          <Icon name="lucide:chevron-right" class="size-4" />
        </button>
      </div>
    </div>
  </section>
</template>
