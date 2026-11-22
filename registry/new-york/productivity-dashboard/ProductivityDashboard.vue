<script setup lang="ts">
  import { computed, nextTick, ref, useId, watch } from 'vue';
  import {
    useElementSize,
    useIntervalFn,
    usePreferredReducedMotion,
    useResizeObserver,
    useTimeoutFn,
  } from '@vueuse/core';
  import { AnimatePresence, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import ProductivityDashboardEnergy from './ProductivityDashboardEnergy.vue';
  import ProductivityDashboardFocus from './ProductivityDashboardFocus.vue';
  import ProductivityDashboardSleepDetail from './ProductivityDashboardSleepDetail.vue';
  import ProductivityDashboardSleepTile from './ProductivityDashboardSleepTile.vue';
  import ProductivityDashboardSounds from './ProductivityDashboardSounds.vue';
  import {
    DEFAULT_RANGES,
    DEFAULT_SESSIONS,
    DEFAULT_SLEEP,
    DEFAULT_SOUND,
  } from './defaults';
  import type {
    ProductivityDashboardProps,
    ProductivityPanelRect,
    ProductivityRange,
    ProductivitySession,
  } from './types';

  const props = withDefaults(defineProps<ProductivityDashboardProps>(), {
    name: 'Mira',
    greeting: 'Good evening',
    date: 'Tuesday, 17 November',
    avatar: '',
    ranges: () => DEFAULT_RANGES,
    sleep: () => DEFAULT_SLEEP,
    sessions: () => DEFAULT_SESSIONS,
    sound: () => DEFAULT_SOUND,
    unread: true,
    class: '',
  });

  const emit = defineEmits<{
    start: [session: ProductivitySession];
    stop: [];
    complete: [session: ProductivitySession];
    'open-energy': [range: ProductivityRange];
    notifications: [];
  }>();

  const range = defineModel<string>('range', { default: '' });
  const expanded = defineModel<boolean>('expanded', { default: false });

  const motionPref = usePreferredReducedMotion();
  const instant = computed(() => motionPref.value === 'reduce');

  const FALLBACK_SESSION: ProductivitySession = {
    id: 'pomodoro',
    label: 'Pomodoro',
    minutes: 25,
    icon: 'timer',
  };

  const activeRange = computed<ProductivityRange | undefined>(
    () => props.ranges.find((r) => r.value === range.value) ?? props.ranges[0],
  );

  const firstSession = computed(() => props.sessions[0] ?? FALLBACK_SESSION);
  const sessionId = ref(firstSession.value.id);
  const session = computed(
    () =>
      props.sessions.find((s) => s.id === sessionId.value) ??
      firstSession.value,
  );
  const remaining = ref(firstSession.value.minutes * 60);
  const running = ref(false);
  const playing = ref(false);
  const menuOpen = ref(false);
  let endsAt = 0;

  const tick = (): void => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    remaining.value = left;
    if (left === 0) {
      emit('complete', session.value);
      stop();
    }
  };
  const timer = useIntervalFn(tick, 250, { immediate: false });

  function start(id?: string): void {
    const next = props.sessions.find((s) => s.id === id) ?? session.value;
    sessionId.value = next.id;
    remaining.value = next.minutes * 60;
    endsAt = Date.now() + remaining.value * 1000;
    running.value = true;
    playing.value = true;
    menuOpen.value = false;
    timer.resume();
    emit('start', next);
  }

  function stop(): void {
    timer.pause();
    delayed.stop();
    const wasRunning = running.value;
    running.value = false;
    playing.value = false;
    sessionId.value = firstSession.value.id;
    remaining.value = firstSession.value.minutes * 60;
    if (wasRunning) emit('stop');
  }

  /** Marks the preset, lets the highlight land, then starts it. */
  const queued = ref('');
  const delayed = useTimeoutFn(() => start(queued.value), 160, {
    immediate: false,
  });

  function select(id: string): void {
    sessionId.value = id;
    queued.value = id;
    if (instant.value) start(id);
    else delayed.start();
  }

  const openMenu = (): void => {
    menuOpen.value = true;
  };
  const closeMenu = (): void => {
    menuOpen.value = false;
  };
  const toggleMenu = (): void => {
    menuOpen.value = !menuOpen.value;
  };
  const toggleSound = (): void => {
    playing.value = !playing.value;
  };
  const handleStart = (): void => start();
  const handleNotifications = (): void => emit('notifications');
  const handleOpenEnergy = (): void => {
    if (activeRange.value) emit('open-energy', activeRange.value);
  };

  /* ---------- tabs ---------- */
  const tabsId = useId();
  const tabEls = ref<HTMLButtonElement[]>([]);
  const tabList = ref<HTMLElement | null>(null);
  const pill = ref({ x: 0, width: 0 });

  const activeIndex = computed(() =>
    Math.max(
      0,
      props.ranges.findIndex((r) => r.value === activeRange.value?.value),
    ),
  );

  const measurePill = (): void => {
    const el = tabEls.value[activeIndex.value];
    if (el) pill.value = { x: el.offsetLeft, width: el.offsetWidth };
  };
  useResizeObserver(tabList, measurePill);
  watch(activeIndex, () => nextTick(measurePill));

  const setRange = (value: string): void => {
    range.value = value;
  };

  const handleTab = (event: MouseEvent): void => {
    const el = event.currentTarget;
    if (el instanceof HTMLElement && el.dataset.range) {
      setRange(el.dataset.range);
    }
  };

  const handleTabKey = (event: KeyboardEvent): void => {
    const count = props.ranges.length;
    let next = -1;
    if (event.key === 'ArrowRight') next = (activeIndex.value + 1) % count;
    else if (event.key === 'ArrowLeft')
      next = (activeIndex.value - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = props.ranges[next];
    if (target) setRange(target.value);
    tabEls.value[next]?.focus();
  };

  /* ---------- expand / collapse ---------- */
  const stage = ref<HTMLElement | null>(null);
  const sleepTile = ref<HTMLElement | null>(null);
  const { width: stageW, height: stageH } = useElementSize(stage);
  const from = ref<ProductivityPanelRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const measureTile = (): void => {
    const s = stage.value?.getBoundingClientRect();
    const t = sleepTile.value?.getBoundingClientRect();
    if (!s || !t) return;
    from.value = {
      top: t.top - s.top,
      left: t.left - s.left,
      width: t.width,
      height: t.height,
    };
  };

  const root = ref<HTMLElement | null>(null);

  watch(expanded, async (open) => {
    measureTile();
    if (!root.value?.contains(document.activeElement)) return;
    await nextTick();
    const selector = open ? '[data-pd-close]' : '[data-pd-expand]';
    const target = root.value.querySelector(selector);
    if (target instanceof HTMLElement) target.focus();
  });

  function expand(): void {
    measureTile();
    menuOpen.value = false;
    expanded.value = true;
  }
  function collapse(): void {
    measureTile();
    expanded.value = false;
  }

  const panelSpring = computed(() =>
    instant.value
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 210, damping: 28, mass: 0.9 },
  );

  const handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && expanded.value) collapse();
  };

  const initials = computed(() =>
    props.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );

  defineExpose({
    start,
    stop,
    select,
    openMenu,
    closeMenu,
    expand,
    collapse,
    setRange,
  });
</script>

<template>
  <section
    ref="root"
    :class="
      cn(
        'pd-root @container relative w-full max-w-226 rounded-[2.5rem] border border-(--pd-card-line) bg-(--pd-card) p-5 text-(--pd-fg) shadow-[0_40px_90px_-30px_oklch(0.2_0.02_60/0.45)] @2xl:p-8',
        props.class,
      )
    "
    aria-label="Productivity dashboard"
    @keydown="handleEscape"
  >
    <header class="flex flex-wrap items-center gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <img
          v-if="avatar"
          :src="avatar"
          alt=""
          class="size-12 shrink-0 rounded-full object-cover"
        />
        <span
          v-else
          aria-hidden="true"
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[oklch(0.78_0.1_55)] to-[oklch(0.55_0.12_30)] text-sm font-semibold text-[oklch(0.98_0.01_60)]"
        >
          {{ initials }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-[17px] font-semibold">
            {{ greeting }}, {{ name }}
          </p>
          <p class="truncate text-sm text-(--pd-muted)">{{ date }}</p>
        </div>
      </div>

      <div
        ref="tabList"
        role="tablist"
        aria-label="Time range"
        class="relative order-last flex h-15 w-full items-center rounded-full border border-(--pd-line) bg-(--pd-tabs) p-1.5 @2xl:order-0 @2xl:w-auto"
        @keydown="handleTabKey"
      >
        <motion.span
          aria-hidden="true"
          class="absolute inset-y-1.5 left-0 rounded-full bg-(--pd-pill) shadow-sm"
          :initial="false"
          :animate="{ x: pill.x, width: pill.width }"
          :transition="
            instant
              ? { duration: 0 }
              : { type: 'spring', stiffness: 320, damping: 30 }
          "
        />
        <button
          v-for="(item, index) in ranges"
          :id="`${tabsId}-${item.value}`"
          :key="item.value"
          ref="tabEls"
          type="button"
          role="tab"
          :aria-selected="index === activeIndex"
          :aria-controls="`${tabsId}-panel`"
          :tabindex="index === activeIndex ? 0 : -1"
          :data-range="item.value"
          :class="[
            'pd-focus relative z-10 h-full flex-1 rounded-full px-7 text-[15px] font-semibold transition-colors duration-300 @2xl:flex-none',
            index === activeIndex
              ? 'text-(--pd-pill-fg)'
              : 'text-(--pd-muted) hover:text-(--pd-fg)',
          ]"
          @click="handleTab"
        >
          {{ item.label }}
        </button>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        class="pd-focus relative flex size-12 shrink-0 items-center justify-center rounded-full border border-(--pd-line) bg-(--pd-tabs) text-(--pd-fg) transition-colors hover:bg-(--pd-chip)"
        @click="handleNotifications"
      >
        <Icon name="lucide:bell" class="size-4.5" />
        <span
          v-if="unread"
          class="absolute top-2.5 right-3 size-2 rounded-full bg-[oklch(0.68_0.2_36)] ring-2 ring-(--pd-tabs)"
        />
      </button>
    </header>

    <div ref="stage" class="relative mt-6 @2xl:mt-8">
      <div class="flex flex-col gap-4 @2xl:gap-4.5">
        <div class="grid gap-4 @2xl:grid-cols-[511fr_311fr] @2xl:gap-4.5">
          <article
            :id="`${tabsId}-panel`"
            role="tabpanel"
            :aria-labelledby="`${tabsId}-${activeRange?.value ?? ''}`"
            class="pd-tile p-6 @2xl:h-78 @2xl:p-7"
          >
            <ProductivityDashboardEnergy
              v-if="activeRange"
              :range="activeRange"
              :instant="instant"
              @open="handleOpenEnergy"
            />
          </article>
          <article ref="sleepTile" class="pd-tile p-6 @2xl:h-78 @2xl:p-7">
            <ProductivityDashboardSleepTile
              :sleep="sleep"
              :hidden="expanded"
              :instant="instant"
              @expand="expand"
            />
          </article>
        </div>
        <div class="grid gap-4 @2xl:grid-cols-2 @2xl:gap-4.5">
          <article
            :class="[
              'pd-tile relative z-10 p-6 transition-[border-color] duration-500 @2xl:h-72 @2xl:p-7',
              running && 'border-(--pd-green-line)!',
            ]"
          >
            <ProductivityDashboardFocus
              :sessions="sessions"
              :session="sessionId"
              :remaining="remaining"
              :running="running"
              :menu-open="menuOpen"
              :instant="instant"
              @toggle-menu="toggleMenu"
              @close-menu="closeMenu"
              @select="select"
              @start="handleStart"
              @stop="stop"
            />
          </article>
          <article
            :class="[
              'pd-tile p-6 transition-[border-color] duration-500 @2xl:h-72 @2xl:p-7',
              playing && 'border-(--pd-violet-line)!',
            ]"
          >
            <ProductivityDashboardSounds
              :sound="sound"
              :playing="playing"
              :instant="instant"
              @toggle="toggleSound"
            />
          </article>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          v-if="expanded"
          role="dialog"
          aria-label="Sleep details"
          class="pd-tile absolute z-30 overflow-hidden shadow-[0_30px_80px_-20px_oklch(0_0_0/0.6)]"
          :initial="from"
          :animate="{ top: 0, left: 0, width: stageW, height: stageH }"
          :exit="from"
          :transition="panelSpring"
        >
          <motion.div
            class="absolute top-0 left-0"
            :style="{ width: `${stageW}px`, height: `${stageH}px` }"
            :initial="{ opacity: 0, filter: 'blur(10px)' }"
            :animate="{ opacity: 1, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, filter: 'blur(10px)' }"
            :transition="instant ? { duration: 0 } : { duration: 0.35 }"
          >
            <ProductivityDashboardSleepDetail
              :sleep="sleep"
              :instant="instant"
              @close="collapse"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  </section>
</template>

<style scoped>
  .pd-root {
    --pd-card: oklch(0.955 0.006 80);
    --pd-card-line: oklch(0.88 0.008 80);
    --pd-tile: oklch(0.99 0.003 80);
    --pd-tile-2: oklch(0.975 0.004 80);
    --pd-line: oklch(0.89 0.006 80);
    --pd-fg: oklch(0.22 0.01 60);
    --pd-muted: oklch(0.52 0.012 60);
    --pd-chip: oklch(0.93 0.006 80);
    --pd-chip-hi: oklch(0.88 0.008 80);
    --pd-tabs: oklch(0.925 0.006 80);
    --pd-pill: oklch(0.22 0.01 60);
    --pd-pill-fg: oklch(0.97 0.004 80);
    --pd-pop: oklch(0.985 0.004 80 / 0.94);
    --pd-track: oklch(0.93 0.008 70);
    --pd-low-a: oklch(0.8 0.09 48);
    --pd-low-b: oklch(0.9 0.045 60);
    --pd-dot-off: oklch(0.9 0.006 80);
    --pd-green: oklch(0.55 0.13 160);
    --pd-green-soft: oklch(0.6 0.12 160 / 0.14);
    --pd-green-line: oklch(0.6 0.12 160 / 0.45);
    --pd-orange: oklch(0.6 0.17 40);
    --pd-violet: oklch(0.58 0.19 285);
    --pd-violet-hi: oklch(0.45 0.2 285);
    --pd-violet-soft: oklch(0.6 0.15 285 / 0.08);
    --pd-violet-line: oklch(0.6 0.15 285 / 0.4);
    --pd-violet-wave: oklch(0.6 0.18 285);
    --pd-wave-idle: oklch(0.78 0.03 285);
  }

  :global(.dark .pd-root) {
    --pd-card: oklch(0.125 0 0);
    --pd-card-line: oklch(0.23 0 0);
    --pd-tile: oklch(0.19 0.002 270);
    --pd-tile-2: oklch(0.16 0.002 270);
    --pd-line: oklch(1 0 0 / 0.07);
    --pd-fg: oklch(0.97 0 0);
    --pd-muted: oklch(0.66 0.004 270);
    --pd-chip: oklch(1 0 0 / 0.07);
    --pd-chip-hi: oklch(1 0 0 / 0.13);
    --pd-tabs: oklch(0.165 0 0);
    --pd-pill: oklch(0.96 0 0);
    --pd-pill-fg: oklch(0.18 0 0);
    --pd-pop: oklch(0.23 0.003 270 / 0.92);
    --pd-track: oklch(1 0 0 / 0.06);
    --pd-low-a: oklch(0.52 0.12 40);
    --pd-low-b: oklch(0.3 0.06 40);
    --pd-dot-off: oklch(1 0 0 / 0.1);
    --pd-green: oklch(0.84 0.12 165);
    --pd-green-soft: oklch(0.7 0.12 165 / 0.2);
    --pd-green-line: oklch(0.8 0.12 165 / 0.28);
    --pd-orange: oklch(0.75 0.14 45);
    --pd-violet: oklch(0.7 0.16 287);
    --pd-violet-hi: oklch(0.9 0.06 290);
    --pd-violet-soft: oklch(0.6 0.15 285 / 0.12);
    --pd-violet-line: oklch(0.7 0.15 287 / 0.3);
    --pd-violet-wave: oklch(0.72 0.15 287);
    --pd-wave-idle: oklch(0.48 0.05 285);
  }

  .pd-root :deep(.pd-tile) {
    border-radius: 1.75rem;
    border: 1px solid var(--pd-line);
    background: linear-gradient(to bottom, var(--pd-tile), var(--pd-tile-2));
  }

  .pd-root :deep(.pd-focus:focus-visible) {
    outline: 2px solid var(--pd-violet);
    outline-offset: 2px;
  }
</style>
