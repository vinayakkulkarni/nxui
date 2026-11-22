<script setup lang="ts">
  import { computed, useId, useTemplateRef } from 'vue';
  import {
    useElementVisibility,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import MotionBentoCard from './MotionBentoCard.vue';
  import type { MotionBentoProps, MotionBentoSpan } from './types';

  const props = withDefaults(defineProps<MotionBentoProps>(), {
    heading: '',
    highlight: '',
    ctaLabel: '',
    ctaHref: '',
    accent: '#3b8cf0',
    paused: false,
    class: '',
  });

  const emit = defineEmits<{ cta: [] }>();

  const SPAN_CLASS: Record<MotionBentoSpan, string> = {
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  };

  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const motionPreference = usePreferredReducedMotion();
  const headingId = useId();

  const still = computed(() => motionPreference.value === 'reduce');
  const playing = computed(
    () => visible.value && !props.paused && !still.value,
  );

  const headingParts = computed(() => {
    const at = props.highlight ? props.heading.indexOf(props.highlight) : -1;
    if (at < 0) return { before: props.heading, strong: '', after: '' };
    return {
      before: props.heading.slice(0, at),
      strong: props.highlight,
      after: props.heading.slice(at + props.highlight.length),
    };
  });

  function spanClass(span: MotionBentoSpan | undefined): string {
    return SPAN_CLASS[span ?? 4];
  }

  function onCta(): void {
    emit('cta');
  }
</script>

<template>
  <section
    ref="root"
    :aria-labelledby="heading ? headingId : undefined"
    :class="cn('mb-root w-full', props.class)"
    :style="{ '--mb-accent': accent }"
  >
    <div
      v-if="heading || ctaLabel || $slots.header"
      class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <slot name="header">
        <h2
          :id="headingId"
          class="max-w-96 text-[1.75rem]/[1.2] font-light tracking-tight text-foreground/70"
        >
          {{ headingParts.before
          }}<span class="font-semibold text-foreground">{{
            headingParts.strong
          }}</span
          >{{ headingParts.after }}
        </h2>
      </slot>
      <slot name="cta">
        <a
          v-if="ctaLabel && ctaHref"
          :href="ctaHref"
          class="mb-cta self-start rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:self-auto"
        >
          {{ ctaLabel }}
        </a>
        <button
          v-else-if="ctaLabel"
          type="button"
          class="mb-cta self-start rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:self-auto"
          @click="onCta"
        >
          {{ ctaLabel }}
        </button>
      </slot>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-12">
      <MotionBentoCard
        v-for="(item, index) in items"
        :key="`${index}-${item.title}`"
        :item="item"
        :playing="playing"
        :still="still"
        :class="spanClass(item.span)"
      >
        <template v-if="!item.art && $slots.art" #default>
          <slot
            name="art"
            :item="item"
            :index="index"
            :playing="playing"
            :still="still"
          />
        </template>
      </MotionBentoCard>
    </div>
  </section>
</template>

<style scoped>
  .mb-root {
    --mb-art:
      radial-gradient(
        70% 50% at 50% 105%,
        rgb(255 255 255 / 0.75),
        transparent 70%
      ),
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--mb-accent) 46%, white),
        color-mix(in oklab, var(--mb-accent) 30%, white)
      );
    --mb-tile: #ffffff;
    --mb-tile-soft: #f3f7fc;
    --mb-glass: rgb(255 255 255 / 0.42);
    --mb-line: rgb(255 255 255 / 0.75);
    --mb-pulse: #ffffff;
    --mb-tile-shadow:
      0 14px 30px -14px color-mix(in oklab, var(--mb-accent) 70%, #0b2a55),
      0 2px 6px -2px rgb(15 40 80 / 0.12);
  }

  .dark .mb-root {
    --mb-art:
      radial-gradient(
        70% 55% at 50% 110%,
        color-mix(in oklab, var(--mb-accent) 38%, transparent),
        transparent 70%
      ),
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--mb-accent) 20%, var(--card)),
        color-mix(in oklab, var(--mb-accent) 7%, var(--card))
      );
    --mb-tile: color-mix(in oklab, var(--mb-accent) 9%, var(--secondary));
    --mb-tile-soft: color-mix(in oklab, var(--mb-accent) 14%, var(--secondary));
    --mb-glass: rgb(255 255 255 / 0.07);
    --mb-line: color-mix(in oklab, var(--mb-accent) 45%, transparent);
    --mb-pulse: color-mix(in oklab, var(--mb-accent) 30%, white);
    --mb-tile-shadow:
      0 16px 32px -14px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.07);
  }

  .mb-cta {
    background: linear-gradient(
      180deg,
      color-mix(in oklab, var(--mb-accent) 80%, white),
      var(--mb-accent)
    );
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.35),
      0 6px 16px -6px var(--mb-accent);
  }
</style>
