<script setup lang="ts">
  import { ref } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { RevealSection } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      sections?: RevealSection[];
      stagger?: boolean;
      class?: string;
    }>(),
    {
      sections: () => [
        {
          number: '01',
          title: 'Describing pixels with words',
          body: 'Ask an agent to build something today and you get a wall of text in a terminal. You squint at localhost, alt-tab back, type "no, the spacing is off, make the hero bigger", pray, repeat.',
        },
        {
          number: '02',
          title: 'Direct with your eyes and hands',
          body: "Your pages and components live on a visual canvas, running live from your own dev server. Point at the thing that is wrong, annotate it, drag a slider — the edit lands in the agent's context.",
        },
        {
          number: '03',
          title: 'For people who care too much',
          body: 'Every component becomes a playable instrument, with sliders, colors and springs derived from your real code. Nothing is trapped in a proprietary file; every change lands on disk, ready to commit.',
        },
      ],
      stagger: true,
      class: '',
    },
  );

  const root = ref<HTMLElement | null>(null);
  const visible = ref(0);

  useIntersectionObserver(
    root,
    ([entry]) => {
      if (!entry.isIntersecting) return;
      visible.value = props.sections.length;
    },
    { threshold: 0.2 },
  );

  const sections = computed(() =>
    props.stagger ? props.sections : props.sections.slice(0, visible.value),
  );
</script>

<template>
  <div ref="root" :class="cn('w-full max-w-xl space-y-10', props.class)">
    <component
      :is="motion.div"
      v-for="(section, i) in sections"
      :key="section.number"
      :initial="{ opacity: 0, y: 28 }"
      :animate="{
        opacity: i < visible ? 1 : 0,
        y: i < visible ? 0 : 28,
      }"
      :transition="{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }"
      class="flex gap-6 border-t border-border/60 pt-6"
    >
      <span class="font-mono text-sm text-muted-foreground/70">
        {{ section.number }}.
      </span>
      <div>
        <h3 class="text-xl font-medium tracking-tight">
          {{ section.title }}
        </h3>
        <p class="mt-2 text-sm/relaxed text-muted-foreground">
          {{ section.body }}
        </p>
      </div>
    </component>
  </div>
</template>
