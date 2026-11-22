<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
  import { onClickOutside } from '@vueuse/core';
  import { AnimatePresence, animate, motion } from 'motion-v';
  import type { ProductivityFocusProps } from './types';

  const props = withDefaults(defineProps<ProductivityFocusProps>(), {
    instant: false,
  });

  const emit = defineEmits<{
    'toggle-menu': [];
    'close-menu': [];
    select: [id: string];
    start: [];
    stop: [];
  }>();

  const R = 64;
  const C = 2 * Math.PI * R;
  /** Shortest arc shown while running, so the head is visible at once. */
  const MIN_ARC = 0.12;

  const menuId = `pd-menu-${useId()}`;
  const wrap = ref<HTMLElement | null>(null);
  const trigger = ref<HTMLButtonElement | null>(null);
  const items = ref<HTMLButtonElement[]>([]);

  const current = computed(
    () =>
      props.sessions.find((s) => s.id === props.session) ?? props.sessions[0],
  );

  const total = computed(() => (current.value?.minutes ?? 25) * 60);

  const clock = computed(() => {
    const secs = Math.max(0, props.remaining);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const target = computed(() => {
    if (!props.running) return 0;
    const done = 1 - props.remaining / total.value;
    return MIN_ARC + (1 - MIN_ARC) * Math.min(1, Math.max(0, done));
  });

  const arc = ref(target.value);
  let arcAnim: ReturnType<typeof animate> | null = null;
  watch(target, (to) => {
    arcAnim?.stop();
    if (props.instant) {
      arc.value = to;
      return;
    }
    arcAnim = animate(arc.value, to, {
      type: 'spring',
      stiffness: 90,
      damping: 18,
      onUpdate: (v) => {
        arc.value = v;
      },
    });
  });
  onBeforeUnmount(() => arcAnim?.stop());

  const dash = computed(() => `${Math.max(0, arc.value) * C} ${C}`);
  const head = computed(() => {
    const angle = arc.value * Math.PI * 2 - Math.PI / 2;
    return { cx: 68 + R * Math.cos(angle), cy: 68 + R * Math.sin(angle) };
  });

  const spring = computed(() =>
    props.instant
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 380, damping: 28 },
  );

  const focusItem = (index: number): void => {
    const count = items.value.length;
    if (!count) return;
    items.value[(index + count) % count]?.focus();
  };

  const selectedIndex = (): number =>
    Math.max(
      0,
      props.sessions.findIndex((s) => s.id === props.session),
    );

  watch(
    () => props.menuOpen,
    async (open) => {
      if (!open) return;
      await nextTick();
      if (wrap.value?.contains(document.activeElement)) {
        focusItem(selectedIndex());
      }
    },
  );

  onClickOutside(wrap, () => {
    if (props.menuOpen) emit('close-menu');
  });

  const handleToggle = (): void => emit('toggle-menu');

  const handleTriggerKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!props.menuOpen) emit('toggle-menu');
      else focusItem(selectedIndex());
    }
  };

  const handleMenuKey = (event: KeyboardEvent): void => {
    const index = items.value.findIndex((el) => el === document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(-1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      emit('close-menu');
      trigger.value?.focus();
    } else if (event.key === 'Tab') {
      emit('close-menu');
    }
  };

  const handleSelect = (event: MouseEvent): void => {
    const el = event.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const id = el.dataset.session;
    if (!id) return;
    emit('select', id);
    trigger.value?.focus();
  };

  const handleStart = (): void => emit('start');
  const handleStop = (): void => emit('stop');
</script>

<template>
  <div class="flex h-full flex-col">
    <div ref="wrap" class="relative z-20 flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-full bg-(--pd-chip)"
      >
        <Icon name="lucide:target" class="size-4.5 text-(--pd-green)" />
      </span>
      <span class="text-[17px] font-medium text-(--pd-muted)">Focus</span>
      <button
        ref="trigger"
        type="button"
        aria-label="Focus presets"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        :aria-controls="menuId"
        :class="[
          'pd-focus ml-auto flex size-9 items-center justify-center rounded-full text-(--pd-fg) transition-colors',
          menuOpen
            ? 'bg-(--pd-chip-hi)'
            : 'bg-(--pd-chip) hover:bg-(--pd-chip-hi)',
        ]"
        @click="handleToggle"
        @keydown="handleTriggerKey"
      >
        <Icon name="lucide:ellipsis" class="size-4.5" />
      </button>

      <AnimatePresence>
        <motion.div
          v-if="menuOpen"
          :id="menuId"
          role="menu"
          aria-label="Focus presets"
          class="absolute top-full right-0 mt-2.5 w-60 origin-top-right rounded-2xl border border-(--pd-line) bg-(--pd-pop) p-1.5 shadow-[0_24px_48px_-16px_oklch(0_0_0/0.55)] backdrop-blur-xl"
          :initial="{ opacity: 0, scale: 0.9, y: -6, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, scale: 0.94, y: -4, filter: 'blur(4px)' }"
          :transition="spring"
          @keydown="handleMenuKey"
        >
          <button
            v-for="item in sessions"
            :key="item.id"
            ref="items"
            type="button"
            role="menuitemradio"
            :aria-checked="item.id === session"
            :data-session="item.id"
            :class="[
              'pd-focus flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-(--pd-fg) transition-colors outline-none',
              item.id === session
                ? 'bg-(--pd-green-soft)'
                : 'hover:bg-(--pd-chip) focus-visible:bg-(--pd-chip)',
            ]"
            @click="handleSelect"
          >
            <Icon
              :name="`lucide:${item.icon}`"
              :class="[
                'size-4.5',
                item.id === session ? 'text-(--pd-green)' : 'text-(--pd-fg)',
              ]"
            />
            {{ item.label }}
            <span class="ml-auto text-[13px] text-(--pd-muted) tabular-nums">
              {{ item.minutes }}m
            </span>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>

    <div class="relative mt-5 flex flex-1 items-center gap-6 @md:gap-8">
      <svg
        viewBox="0 0 136 136"
        class="size-28 shrink-0 overflow-visible @md:size-34"
        aria-hidden="true"
      >
        <circle
          cx="68"
          cy="68"
          :r="R"
          fill="none"
          class="stroke-(--pd-track)"
          stroke-width="6"
        />
        <circle
          cx="68"
          cy="68"
          :r="R"
          fill="none"
          stroke="oklch(0.84 0.13 165)"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="dash"
          :opacity="arc > 0.004 ? 1 : 0"
          transform="rotate(-90 68 68)"
          class="drop-shadow-[0_0_6px_oklch(0.8_0.14_165/0.6)]"
        />
        <circle
          v-if="arc > 0.004"
          :cx="head.cx"
          :cy="head.cy"
          r="5"
          class="fill-(--pd-fg)"
        />
      </svg>

      <div class="flex min-w-0 flex-col items-start">
        <p
          class="text-5xl leading-none tracking-tight text-(--pd-fg) tabular-nums @md:text-6xl"
          role="timer"
          :aria-label="`${clock} left`"
        >
          {{ clock }}
        </p>
        <div class="mt-4 grid">
          <AnimatePresence :initial="false">
            <motion.span
              :key="running ? 'on' : 'ready'"
              :class="[
                'col-start-1 row-start-1 w-fit rounded-full px-3 py-1 text-sm font-medium',
                running
                  ? 'bg-(--pd-green-soft) text-(--pd-green)'
                  : 'bg-(--pd-chip) text-(--pd-muted)',
              ]"
              :initial="{ opacity: 0, filter: 'blur(4px)' }"
              :animate="{ opacity: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, filter: 'blur(4px)' }"
              :transition="instant ? { duration: 0 } : { duration: 0.25 }"
            >
              {{ running ? `${current?.label ?? 'Focus'} · on` : 'Ready' }}
            </motion.span>
          </AnimatePresence>
        </div>
        <div class="mt-3 grid @md:absolute @md:right-0 @md:bottom-0 @md:mt-0">
          <AnimatePresence :initial="false">
            <motion.button
              :key="running ? 'stop' : 'start'"
              type="button"
              :class="[
                'pd-focus col-start-1 row-start-1 h-10 rounded-full px-5 text-[15px] font-medium transition-colors',
                running
                  ? 'bg-(--pd-pill) text-(--pd-pill-fg) hover:opacity-90'
                  : 'bg-(--pd-chip) text-(--pd-muted) hover:text-(--pd-fg)',
              ]"
              :initial="{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }"
              :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }"
              :transition="spring"
              @click="running ? handleStop() : handleStart()"
            >
              {{ running ? 'Stop' : 'Start' }}
            </motion.button>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
</template>
