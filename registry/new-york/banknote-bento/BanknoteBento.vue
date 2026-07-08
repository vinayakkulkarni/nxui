<script setup lang="ts">
  // Banknote bento: engraving-style bento cards with duotone tints, serif
  // captions, and an optional ironbow thermal card whose heat field rises
  // and falls. Inspired by "brutally fresh bento cards" by @saintdsgn.
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import BanknoteBentoThermal from './BanknoteBentoThermal.vue';
  import type { BanknoteBentoProps, BanknoteBentoItem } from './types';

  const props = withDefaults(defineProps<BanknoteBentoProps>(), {
    thermalCycle: 8,
    class: '',
  });

  function spanClass(item: BanknoteBentoItem): string {
    if (item.span === 'wide') return 'col-span-2';
    if (item.span === 'tall') return 'row-span-2';
    return '';
  }

  function captionClass(item: BanknoteBentoItem): string {
    switch (item.captionPosition ?? 'top-left') {
      case 'top-right':
        return 'top-4 right-4 text-right sm:top-5 sm:right-5';
      case 'bottom-left':
        return 'bottom-4 left-4 sm:bottom-5 sm:left-5';
      case 'bottom-right':
        return 'right-4 bottom-4 text-right sm:right-5 sm:bottom-5';
      default:
        return 'top-4 left-4 sm:top-5 sm:left-5';
    }
  }
</script>

<template>
  <div
    :class="
      cn(
        'grid w-full auto-rows-[minmax(9rem,1fr)] grid-cols-2 gap-3 sm:auto-rows-[minmax(11rem,1fr)] sm:gap-4 lg:grid-cols-3',
        props.class,
      )
    "
  >
    <component
      :is="motion.div"
      v-for="(item, i) in items"
      :key="item.src"
      :class="
        cn(
          'group relative overflow-hidden rounded-sm border border-black/10 shadow-sm dark:border-white/10',
          spanClass(item),
        )
      "
      :initial="{ opacity: 0, y: 18 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :in-view-options="{ once: true }"
      :transition="{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }"
    >
      <BanknoteBentoThermal
        v-if="item.thermal"
        :src="item.src"
        :tint="item.tint"
        :cycle="thermalCycle"
      />
      <template v-else>
        <img
          :src="item.src"
          :alt="item.caption ?? ''"
          class="size-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
          draggable="false"
        />
        <div
          v-if="item.tint"
          class="pointer-events-none absolute inset-0 mix-blend-color"
          :style="{ background: item.tint }"
        />
        <div
          v-if="item.tint"
          class="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply"
          :style="{ background: item.tint }"
        />
      </template>

      <span
        v-if="item.caption"
        :class="
          cn(
            'absolute max-w-[85%] font-serif text-lg/snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] sm:text-2xl/snug',
            captionClass(item),
          )
        "
      >
        {{ item.caption }}
      </span>

      <span
        v-if="item.storeBadge"
        class="absolute right-4 bottom-4 flex items-center gap-1.5 bg-white px-3 py-1.5 font-serif text-sm text-black sm:right-5 sm:bottom-5"
      >
        <Icon name="simple-icons:apple" class="size-3.5" />
        App Store
      </span>
    </component>
  </div>
</template>
