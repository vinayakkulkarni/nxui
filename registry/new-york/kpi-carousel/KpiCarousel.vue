<script setup lang="ts">
  import { computed, ref, useTemplateRef } from 'vue';
  import {
    useElementHover,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import type { KpiCarouselProps, KpiTone, KpiToneStyle } from './types';

  const props = withDefaults(defineProps<KpiCarouselProps>(), {
    interval: 0,
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

  // Optional autoplay, paused while the pointer or keyboard focus is inside.
  useIntervalFn(
    () => {
      if (props.interval > 0 && !hovered.value && !focused.value) next();
    },
    () => Math.max(1000, props.interval || 1000),
  );

  const TONES: Record<KpiTone, KpiToneStyle> = {
    best: {
      card: 'border-emerald-600/40 bg-linear-to-br from-emerald-500/18 to-emerald-500/6 dark:border-emerald-500/40 dark:from-emerald-500/25 dark:to-emerald-900/20',
      title: 'text-emerald-700 dark:text-emerald-400',
      delta: 'text-emerald-700 dark:text-emerald-400',
    },
    worst: {
      card: 'border-rose-600/40 bg-linear-to-br from-rose-500/18 to-rose-500/6 dark:border-rose-500/40 dark:from-rose-500/25 dark:to-rose-900/20',
      title: 'text-rose-700 dark:text-rose-500',
      delta: 'text-rose-700 dark:text-rose-500',
    },
    neutral: {
      card: 'border-sky-600/40 bg-linear-to-br from-sky-500/15 to-sky-500/5 dark:border-sky-500/45 dark:from-sky-500/20 dark:to-sky-900/20',
      title: 'text-foreground',
      delta: 'text-sky-700 dark:text-sky-400',
    },
  };

  // Each slide is the full viewport width plus the track gap, so the
  // neighbouring cards peek into the panel padding on either side.
  const trackStyle = computed(() => ({
    transform: `translateX(calc(${active.value} * -1 * (100% + 0.75rem)))`,
    transition:
      motion.value === 'reduce'
        ? 'none'
        : 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
  }));

  function deltaText(delta: number): string {
    return `${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`;
  }

  function setFocused(value: boolean): void {
    focused.value = value;
  }
</script>

<template>
  <section
    ref="root"
    :class="[
      'w-full overflow-hidden rounded-2xl border border-dashed bg-card p-4 text-card-foreground',
      props.class,
    ]"
    role="region"
    aria-roledescription="carousel"
    :aria-label="props.title"
    @focusin="setFocused(true)"
    @focusout="setFocused(false)"
    @keydown="onKeydown"
  >
    <header class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-base font-medium">{{ props.title }}</h3>
      <div class="flex gap-1.5">
        <button
          type="button"
          :aria-label="`Previous in ${props.title}`"
          class="flex size-7 items-center justify-center rounded-full border bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          @click="previous"
        >
          <Icon name="lucide:chevron-left" class="size-4" />
        </button>
        <button
          type="button"
          :aria-label="`Next in ${props.title}`"
          class="flex size-7 items-center justify-center rounded-full border bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          @click="next"
        >
          <Icon name="lucide:chevron-right" class="size-4" />
        </button>
      </div>
    </header>

    <div class="flex gap-3" :style="trackStyle">
      <article
        v-for="(item, index) in props.items"
        :key="`${item.title}-${index}`"
        :class="[
          'flex w-full shrink-0 items-center justify-between gap-4 rounded-xl border p-4',
          TONES[item.tone].card,
        ]"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${index + 1} of ${count}: ${item.title}`"
        :aria-hidden="index !== active"
      >
        <div class="min-w-0">
          <p
            :class="['truncate text-base font-medium', TONES[item.tone].title]"
          >
            {{ item.title }}
          </p>
          <p class="mt-1 truncate text-sm text-muted-foreground">
            {{ item.caption }}
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end">
          <span
            :class="[
              'font-medium tracking-tight tabular-nums',
              item.delta === undefined ? 'text-3xl' : 'text-xl',
            ]"
          >
            {{ item.value }}
          </span>
          <span
            v-if="item.delta !== undefined"
            :class="[
              'mt-1 inline-flex items-center gap-1 text-base font-medium tabular-nums',
              TONES[item.tone].delta,
            ]"
          >
            {{ deltaText(item.delta) }}
            <Icon
              :name="
                item.delta < 0 ? 'lucide:trending-down' : 'lucide:trending-up'
              "
              class="size-4"
            />
          </span>
        </div>
      </article>
    </div>

    <div class="mt-3 flex justify-center gap-1.5">
      <button
        v-for="(item, index) in props.items"
        :key="`dot-${item.title}-${index}`"
        type="button"
        :aria-label="`Show ${item.title}`"
        :aria-current="index === active"
        :class="[
          'size-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          index === active
            ? 'bg-muted-foreground'
            : 'bg-muted-foreground/30 hover:bg-muted-foreground/60',
        ]"
        @click="go(index)"
      />
    </div>
  </section>
</template>
