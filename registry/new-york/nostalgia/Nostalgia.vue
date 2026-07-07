<script setup lang="ts">
  // Nostalgia viewer: a vintage slide-viewer device cycles through memories
  // while a fan of polaroid thumbnails arcs around it and a year + serif
  // title crossfade underneath. Inspired by "nostalgia, as a component"
  // by @ozzyxs1a.
  import { ref, computed, onBeforeUnmount, watch } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { NostalgiaProps } from './types';

  const props = withDefaults(defineProps<NostalgiaProps>(), {
    autoplay: true,
    interval: 2600,
    pauseOnHover: true,
    monochrome: true,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
  }>();

  const active = defineModel<number>({ default: 0 });
  const paused = ref(false);

  const count = computed(() => props.items.length);

  function goTo(index: number) {
    active.value = ((index % count.value) + count.value) % count.value;
    emit('change', active.value);
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    stop();
    if (!props.autoplay || count.value < 2) return;
    timer = setInterval(() => {
      if (!paused.value) goTo(active.value + 1);
    }, props.interval);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  watch(
    () => [props.autoplay, props.interval, count.value],
    () => start(),
    { immediate: true },
  );
  onBeforeUnmount(() => stop());

  // Signed arc slot for each item: 0 = in the viewer, negative = past
  // memories fanned to the left, positive = upcoming fanned to the right.
  function slotOf(index: number): number {
    const rel = (index - active.value + count.value) % count.value;
    return rel <= count.value / 2 ? rel : rel - count.value;
  }

  function fanStyle(index: number) {
    const s = slotOf(index);
    const d = Math.abs(s);
    return {
      x: s * 112,
      y: 24 + d ** 1.25 * 14,
      rotate: s * 3.5,
      scale: 1 - d * 0.02,
      opacity: Math.max(0.18, 1 - d * 0.17),
      zIndex: 20 - d,
    };
  }

  const counter = computed(() => String(active.value + 1).padStart(2, '0'));
</script>

<template>
  <div
    :class="
      cn(
        'relative flex w-full flex-col items-center overflow-hidden py-10',
        props.class,
      )
    "
    @mouseenter="paused = pauseOnHover"
    @mouseleave="paused = false"
  >
    <div class="relative flex h-80 w-full items-start justify-center">
      <!-- Polaroid fan -->
      <component
        :is="motion.button"
        v-for="(item, i) in items"
        :key="item.src"
        type="button"
        class="absolute top-16 left-1/2 -ml-11 size-22 cursor-pointer rounded-md border-4 border-white bg-white shadow-md"
        :initial="false"
        :animate="fanStyle(i)"
        :transition="{ type: 'spring', stiffness: 220, damping: 26 }"
        :style="{ zIndex: fanStyle(i).zIndex }"
        :aria-label="`View ${item.title} (${item.year})`"
        @click="goTo(i)"
      >
        <img
          :src="item.src"
          :alt="item.title"
          class="size-full rounded-xs object-cover"
          :class="monochrome && 'grayscale'"
          draggable="false"
        />
      </component>

      <!-- Slide-viewer device -->
      <div
        class="relative z-30 w-52 rounded-2xl bg-neutral-900 p-2 shadow-2xl ring-1 ring-black/40"
      >
        <div
          class="mb-1.5 text-center text-[7px] font-semibold tracking-[0.4em] text-neutral-600 uppercase select-none"
        >
          nxui
        </div>

        <!-- Screen -->
        <div class="relative aspect-square overflow-hidden rounded-lg bg-black">
          <AnimatePresence mode="wait">
            <component
              :is="motion.div"
              :key="active"
              class="absolute inset-0"
              :initial="{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }"
              :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }"
              :transition="{ duration: 0.55, ease: 'easeOut' }"
            >
              <img
                v-if="items[active]"
                :src="items[active].src"
                :alt="items[active].title"
                class="size-full object-cover brightness-90 contrast-105"
                :class="monochrome && 'grayscale'"
                draggable="false"
              />
            </component>
          </AnimatePresence>

          <!-- Vignette + focus crosshair -->
          <div
            class="pointer-events-none absolute inset-0"
            style="
              background: radial-gradient(
                75% 75% at 50% 42%,
                transparent 30%,
                rgba(0, 0, 0, 0.78) 100%
              );
            "
          />
          <span
            class="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 font-mono text-[10px] text-white/35 select-none"
          >
            +
          </span>
        </div>

        <!-- Chin: record dot + counter -->
        <div class="flex h-6 items-center justify-between px-1.5 pt-1.5">
          <span class="mx-auto size-1 rounded-full bg-red-600" />
          <span
            class="rounded-xs bg-black px-1 font-mono text-[10px]/4 font-bold text-amber-500 tabular-nums"
          >
            {{ counter }}
          </span>
        </div>
      </div>
    </div>

    <!-- Year + memory title -->
    <div class="flex h-16 flex-col items-center gap-1 text-center">
      <AnimatePresence mode="wait">
        <component
          :is="motion.div"
          :key="active"
          class="flex flex-col items-center gap-1"
          :initial="{ opacity: 0, y: 6, filter: 'blur(6px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, y: -6, filter: 'blur(6px)' }"
          :transition="{ duration: 0.4, ease: 'easeOut' }"
        >
          <span
            class="text-[10px] tracking-[0.35em] text-muted-foreground/70 tabular-nums select-none"
          >
            — {{ items[active]?.year }} —
          </span>
          <span class="font-serif text-lg text-foreground italic">
            {{ items[active]?.title }}
          </span>
        </component>
      </AnimatePresence>
    </div>
  </div>
</template>
