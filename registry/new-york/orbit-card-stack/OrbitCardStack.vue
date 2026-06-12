<script lang="ts">
  import type { OrbitStackItem } from './types';

  const defaultItems: OrbitStackItem[] = [
    {
      name: 'Mira Vale',
      role: 'Creative Lead',
      description:
        'Shapes visual systems with enough restraint to feel expensive and enough edge to be remembered.',
      accent: '#f8d66d',
      initials: 'MV',
      stat: 'Identity',
    },
    {
      name: 'Noor Kade',
      role: 'Product Strategy',
      description:
        'Turns loose ideas into sharp product moves, crisp priorities, and launchable experiences.',
      accent: '#78dcca',
      initials: 'NK',
      stat: 'Roadmap',
    },
    {
      name: 'Ari Chen',
      role: 'Founder',
      description:
        'Sets the taste bar, protects the details, and keeps the whole team pointed at the same high signal.',
      accent: '#f3f1ea',
      initials: 'AC',
      stat: 'Vision',
    },
    {
      name: 'Sana Holt',
      role: 'Frontend Engineer',
      description:
        'Builds the motion, polish, and interface texture that make the product feel calm under pressure.',
      accent: '#b9a7ff',
      initials: 'SH',
      stat: 'Motion',
    },
    {
      name: 'Ezra Moon',
      role: 'Operations',
      description:
        'Keeps the machine quiet, the handoffs clean, and the team moving without pointless friction.',
      accent: '#ff9d77',
      initials: 'EM',
      stat: 'Systems',
    },
  ];
</script>

<script setup lang="ts">
  import { motion } from 'motion-v';
  import { useMediaQuery } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { OrbitStackItem } from './types';
  import OrbitCardStackPortrait from './OrbitCardStackPortrait.vue';

  function clampIndex(index: number, length: number): number {
    return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
  }

  const props = withDefaults(
    defineProps<{
      items?: OrbitStackItem[];
      defaultActiveIndex?: number;
      spread?: number;
      lift?: number;
      class?: string;
      cardClass?: string;
    }>(),
    {
      items: () => defaultItems,
      defaultActiveIndex: 2,
      spread: 168,
      lift: 34,
      class: '',
      cardClass: '',
    },
  );

  const emit = defineEmits<{
    activeChange: [item: OrbitStackItem, index: number];
  }>();

  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const safeItems = computed(() =>
    props.items.length ? props.items : defaultItems,
  );
  const defaultIndex = computed(() =>
    clampIndex(props.defaultActiveIndex, safeItems.value.length),
  );
  const center = computed(() => (safeItems.value.length - 1) / 2);

  const expanded = ref(false);
  const activeIndex = ref(defaultIndex.value);
  const raisedIndex = ref(defaultIndex.value);

  const raiseTimeoutRef = ref<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimeoutRef = ref<ReturnType<typeof setTimeout> | null>(null);

  const transition = computed(() =>
    shouldReduceMotion.value
      ? { duration: 0.01 }
      : { type: 'spring' as const, stiffness: 350, damping: 30, mass: 0.7 },
  );

  const cardLayouts = computed(() =>
    safeItems.value.map((_, index) => {
      const fromCenter = index - center.value;
      const collapsedFromActive = index - defaultIndex.value;
      const expandedRotate = fromCenter * 8.5;
      return {
        collapsed: {
          x: collapsedFromActive * 10,
          y: Math.abs(collapsedFromActive) * 5,
          rotate: collapsedFromActive * 2.8,
        },
        expanded: {
          x: fromCenter * props.spread,
          y:
            Math.abs(fromCenter) * 30 +
            Math.max(0, Math.abs(fromCenter) - 1) * 10,
          rotate: expandedRotate,
        },
      };
    }),
  );

  function activateCard(item: OrbitStackItem, index: number) {
    activeIndex.value = index;
    emit('activeChange', item, index);
    if (raiseTimeoutRef.value) window.clearTimeout(raiseTimeoutRef.value);
    raiseTimeoutRef.value = window.setTimeout(
      () => {
        raisedIndex.value = index;
      },
      shouldReduceMotion.value ? 0 : 45,
    );
  }

  function scheduleCollapse() {
    if (collapseTimeoutRef.value) window.clearTimeout(collapseTimeoutRef.value);
    collapseTimeoutRef.value = window.setTimeout(() => {
      expanded.value = false;
      activeIndex.value = defaultIndex.value;
      raisedIndex.value = defaultIndex.value;
    }, 80);
  }

  function cancelCollapse() {
    if (collapseTimeoutRef.value) {
      window.clearTimeout(collapseTimeoutRef.value);
      collapseTimeoutRef.value = null;
    }
  }

  function getCardStyle(index: number) {
    const raised = raisedIndex.value === index;
    const zIndex = raised
      ? 80
      : expanded.value
        ? 50 - Math.abs(index - raisedIndex.value)
        : 50 - Math.abs(index - defaultIndex.value);
    return { zIndex };
  }

  function getCardAnimate(index: number) {
    const itemLayout =
      cardLayouts.value[index] ?? cardLayouts.value[defaultIndex.value];
    const layout = expanded.value ? itemLayout.expanded : itemLayout.collapsed;
    const active = activeIndex.value === index;
    return {
      x: `calc(-50% + ${layout.x}px)`,
      y: `calc(-50% + ${layout.y - (active && expanded.value ? props.lift : 0)}px)`,
      rotate: layout.rotate,
      scale: expanded.value ? 0.985 : 0.97,
    };
  }

  onBeforeUnmount(() => {
    if (raiseTimeoutRef.value) window.clearTimeout(raiseTimeoutRef.value);
    if (collapseTimeoutRef.value) window.clearTimeout(collapseTimeoutRef.value);
  });
</script>

<template>
  <div
    :class="
      cn(
        'relative flex min-h-full w-full items-center justify-center overflow-hidden p-8',
        props.class,
      )
    "
  >
    <div class="relative h-[470px] w-full max-w-[980px]">
      <component
        :is="motion.article"
        v-for="(item, index) in safeItems"
        :key="`${item.name}-${index}`"
        :class="
          cn(
            'absolute left-1/2 top-1/2 w-[min(78vw,21rem)] origin-bottom cursor-pointer rounded-[1.9rem] border border-black/10 bg-[#e9e6df] p-4 text-[#141414] outline-none',
            'focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            props.cardClass,
          )
        "
        :style="getCardStyle(index)"
        :animate="getCardAnimate(index)"
        :transition="transition"
        tabindex="0"
        @mouseenter="
          cancelCollapse();
          expanded = true;
          activateCard(item, index);
        "
        @mouseleave="scheduleCollapse"
        @focus="
          expanded = true;
          activateCard(item, index);
        "
      >
        <div class="relative">
          <OrbitCardStackPortrait :item="item" />
          <div
            class="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg shadow-black/20"
          >
            <Icon name="lucide:arrow-up-right" class="size-4" />
          </div>
        </div>
        <div class="px-2 pb-2 pt-6">
          <div>
            <p
              class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              {{ item.role }}
            </p>
            <h3
              class="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-zinc-950"
            >
              {{ item.name }}
            </h3>
          </div>
          <p
            class="mt-4 max-w-[17rem] text-[0.98rem] font-medium leading-[1.42] tracking-[-0.01em] text-zinc-700"
          >
            {{ item.description }}
          </p>
          <div class="mt-5 border-t border-black/10 pt-4">
            <span
              class="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              {{ item.stat ?? 'Profile' }}
            </span>
          </div>
        </div>
      </component>
    </div>
  </div>
</template>
