<script setup lang="ts">
  // Aurora accordion: the opened row detaches into its own card while an
  // aurora gradient blooms behind the answer, then settles into a calm glow.
  // Inspired by the "Aurora accordion" exploration by @AliGrids / @stevelauda_.
  import { ref, computed } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { AuroraAccordionProps, AuroraAccordionItem } from './types';

  const props = withDefaults(defineProps<AuroraAccordionProps>(), {
    auroraColors: () => ['#2563eb', '#9333ea', '#ea580c'],
    bloomDuration: 1400,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number | null];
  }>();

  const open = ref<number | null>(null);

  function toggle(index: number) {
    open.value = open.value === index ? null : index;
    emit('change', open.value);
  }

  // Split rows into contiguous groups around the opened row so the active
  // item detaches into its own card while the rest stay grouped.
  interface Segment {
    key: string;
    open: boolean;
    rows: { item: AuroraAccordionItem; index: number }[];
  }

  const segments = computed<Segment[]>(() => {
    const out: Segment[] = [];
    let run: Segment | null = null;
    props.items.forEach((item, index) => {
      if (index === open.value) {
        run = null;
        out.push({ key: `open-${index}`, open: true, rows: [{ item, index }] });
        return;
      }
      if (!run) {
        run = { key: `run-${index}`, open: false, rows: [] };
        out.push(run);
      }
      run.rows.push({ item, index });
    });
    return out;
  });

  const auroraGradient = computed(() => {
    const [a, b, c] = [
      props.auroraColors[0] ?? '#2563eb',
      props.auroraColors[1] ?? '#9333ea',
      props.auroraColors[2] ?? '#ea580c',
    ];
    return [
      `radial-gradient(ellipse 80% 90% at 18% 10%, ${a}cc, transparent 60%)`,
      `radial-gradient(ellipse 70% 80% at 85% 25%, ${c}b3, transparent 55%)`,
      `radial-gradient(ellipse 90% 70% at 55% 95%, ${b}99, transparent 60%)`,
    ].join(', ');
  });

  const spring = {
    type: 'spring' as const,
    stiffness: 240,
    damping: 30,
  };
</script>

<template>
  <div :class="cn('flex w-full flex-col gap-3', props.class)">
    <component
      :is="motion.div"
      v-for="segment in segments"
      :key="segment.key"
      layout
      :transition="spring"
      class="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <!-- Aurora bloom behind the opened card -->
      <AnimatePresence>
        <component
          :is="motion.div"
          v-if="segment.open"
          class="pointer-events-none absolute inset-0 blur-2xl"
          :style="{ background: auroraGradient }"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: [0, 0.9, 0.35] }"
          :exit="{ opacity: 0 }"
          :transition="{
            duration: bloomDuration / 1000,
            times: [0, 0.35, 1],
            ease: 'easeOut',
          }"
        />
      </AnimatePresence>

      <div
        v-for="({ item, index }, rowPos) in segment.rows"
        :key="item.title"
        class="relative"
      >
        <div
          v-if="rowPos > 0"
          class="mx-5 border-t border-border"
          aria-hidden="true"
        />
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
          :aria-expanded="index === open"
          @click="toggle(index)"
        >
          <Icon
            v-if="item.icon"
            :name="item.icon"
            class="size-5 shrink-0 text-muted-foreground"
          />
          <span class="flex-1 font-semibold text-foreground">
            {{ item.title }}
          </span>
          <component
            :is="motion.span"
            class="grid shrink-0 place-items-center text-muted-foreground"
            :initial="false"
            :animate="{ rotate: index === open ? 45 : 0 }"
            :transition="spring"
          >
            <Icon name="lucide:plus" class="size-5" />
          </component>
        </button>

        <!-- Answer body -->
        <AnimatePresence>
          <component
            :is="motion.div"
            v-if="index === open"
            class="overflow-hidden"
            :initial="{ height: 0, opacity: 0 }"
            :animate="{ height: 'auto', opacity: 1 }"
            :exit="{ height: 0, opacity: 0 }"
            :transition="spring"
          >
            <p class="px-5 pb-5 text-sm/relaxed text-muted-foreground">
              {{ item.content }}
            </p>
          </component>
        </AnimatePresence>
      </div>
    </component>
  </div>
</template>
