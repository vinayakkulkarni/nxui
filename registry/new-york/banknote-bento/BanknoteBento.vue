<script setup lang="ts">
  // Banknote bento: vintage engravings rendered as ink-on-paper duotones
  // (like banknote intaglio printing), serif captions, and an optional
  // thermal-camera card whose heat boundary rises and recedes over the
  // artwork. Port of "brutally fresh bento cards" by @saintdsgn.
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import BanknoteBentoThermal from './BanknoteBentoThermal.vue';
  import type { BanknoteBentoProps, BanknoteBentoItem } from './types';

  const props = withDefaults(defineProps<BanknoteBentoProps>(), {
    paper: '#eae6da',
    thermalCycle: 9,
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

  function duotoneFilter(item: BanknoteBentoItem): Record<string, string> {
    const style: Record<string, string> = {
      objectPosition: item.focus ?? '50% 50%',
    };
    if (item.zoom && item.zoom !== 1) {
      style.transform = `scale(${item.zoom})`;
      style.transformOrigin = item.focus ?? '50% 50%';
    }
    return style;
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
      :class="cn('group relative overflow-hidden shadow-sm', spanClass(item))"
      :style="{ background: paper }"
      :initial="{ opacity: 0, y: 18 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :in-view-options="{ once: true }"
      :transition="{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }"
    >
      <BanknoteBentoThermal
        v-if="item.thermal"
        :src="item.src"
        :ink="item.ink"
        :paper="paper"
        :cycle="thermalCycle"
        :caption="item.caption"
        :focus="item.focus"
      />
      <template v-else>
        <!-- CSS duotone: ink background + lighten-blended grayscale image
             (shadows -> ink), then a paper multiply (highlights -> paper). -->
        <div
          class="absolute inset-0 overflow-hidden"
          :style="{ background: item.ink ?? '#1c1917' }"
        >
          <img
            :src="item.src"
            :alt="item.caption ?? ''"
            class="size-full object-cover grayscale mix-blend-lighten transition-transform duration-700 group-hover:scale-[1.03]"
            :style="duotoneFilter(item)"
            draggable="false"
          />
          <div
            class="pointer-events-none absolute inset-0 mix-blend-multiply"
            :style="{ background: paper }"
          />
        </div>
      </template>

      <span
        v-if="item.caption && !item.thermal"
        :class="
          cn(
            'absolute max-w-[85%] font-serif text-lg/snug sm:text-2xl/snug',
            captionClass(item),
          )
        "
        :style="{ color: item.captionColor ?? '#f4f1e8' }"
      >
        {{ item.caption }}
      </span>

      <span
        v-if="item.storeBadge"
        class="absolute right-4 bottom-4 flex items-center gap-1.5 bg-white px-3 py-1.5 font-serif text-sm text-black shadow-sm sm:right-5 sm:bottom-5"
      >
        <Icon name="simple-icons:apple" class="size-3.5" />
        App Store
      </span>
    </component>
  </div>
</template>
