<script setup lang="ts">
  // A segmented character input rendered as a row of circular cells. One
  // letter per circle, an accent ring + blinking caret marks the active cell.
  // With `words`, it auto-types each in a loop, collapses the row into a
  // single center circle, then spreads back out. Also accepts real keyboard
  // input when focused.
  // Inspired by the circular typing interaction by @hours.
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { motion } from 'motion-v';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { CircleInputProps } from './types';

  const props = withDefaults(defineProps<CircleInputProps>(), {
    length: 5,
    modelValue: '',
    words: () => ['HELLO', 'WORLD'],
    autoplay: true,
    typeSpeed: 260,
    holdDuration: 1100,
    accent: '#22d3ee',
    size: 72,
    gap: 20,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    complete: [word: string];
  }>();

  const value = ref(props.modelValue.slice(0, props.length).toUpperCase());
  const activeIndex = ref(0);
  const layoutExpanded = ref(true);
  const focused = ref(false);
  const root = ref<HTMLElement | null>(null);

  const reduced = usePreferredReducedMotion();
  const center = computed(() => (props.length - 1) / 2);
  const stepPx = computed(() => props.size + props.gap);
  const cells = computed(() => Array.from({ length: props.length }));
  const rowWidth = computed(
    () => props.length * props.size + (props.length - 1) * props.gap,
  );

  const letters = computed(() => value.value.split(''));
  function letterAt(i: number) {
    return letters.value[i] ?? '';
  }

  watch(
    () => props.modelValue,
    (next) => {
      const clamped = next.slice(0, props.length).toUpperCase();
      if (clamped !== value.value) {
        value.value = clamped;
        activeIndex.value = Math.min(clamped.length, props.length - 1);
      }
    },
  );

  function commit(next: string) {
    value.value = next;
    emit('update:modelValue', next);
  }

  // ---- Autoplay state machine --------------------------------------------
  let runId = 0;
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function runAutoplay() {
    const myRun = ++runId;
    const alive = () => myRun === runId && !focused.value;

    // Reduced motion: show the first word statically, no loop.
    if (reduced.value === 'reduce') {
      const word = props.words[0] ?? '';
      commit(word.slice(0, props.length));
      activeIndex.value = Math.min(word.length, props.length - 1);
      return;
    }

    while (alive() && props.autoplay && props.words.length > 0) {
      for (const raw of props.words) {
        if (!alive()) return;
        const word = raw.slice(0, props.length).toUpperCase();

        // Type in, one letter per cell.
        commit('');
        activeIndex.value = 0;
        layoutExpanded.value = true;
        for (let i = 0; i < word.length; i++) {
          if (!alive()) return;
          commit(word.slice(0, i + 1));
          activeIndex.value = Math.min(i + 1, props.length - 1);
          await sleep(props.typeSpeed);
        }
        if (!alive()) return;
        activeIndex.value = props.length - 1;
        emit('complete', word);
        await sleep(props.holdDuration);
        if (!alive()) return;

        // Clear, collapse to center, then spread back out.
        commit('');
        activeIndex.value = 0;
        layoutExpanded.value = false;
        await sleep(460);
        if (!alive()) return;
        layoutExpanded.value = true;
        await sleep(520);
      }
    }
  }

  function stopAutoplay() {
    runId++;
  }

  // ---- Real keyboard input -----------------------------------------------
  function onKeydown(e: KeyboardEvent) {
    if (!focused.value) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.value.slice(0, -1);
      commit(next);
      activeIndex.value = next.length;
      return;
    }
    if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
      e.preventDefault();
      if (value.value.length >= props.length) return;
      const next = (value.value + e.key).toUpperCase();
      commit(next);
      activeIndex.value = Math.min(next.length, props.length - 1);
    }
  }

  function onFocus() {
    focused.value = true;
    stopAutoplay();
    layoutExpanded.value = true;
    // Autoplay leaves a demo word in the cells; clear it so the user types
    // into an empty field. A controlled (autoplay-off) field keeps its value.
    if (props.autoplay) {
      commit('');
      activeIndex.value = 0;
    }
  }
  function onBlur() {
    focused.value = false;
    if (props.autoplay) runAutoplay();
  }

  useEventListener(root, 'keydown', onKeydown);

  watch(
    () => props.autoplay,
    (on) => {
      if (on && !focused.value) runAutoplay();
      else stopAutoplay();
    },
  );

  onMounted(() => {
    if (props.autoplay) runAutoplay();
    else activeIndex.value = Math.min(value.value.length, props.length - 1);
  });
  onBeforeUnmount(stopAutoplay);

  const spring = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 30,
  };

  function cellX(i: number) {
    return layoutExpanded.value ? (i - center.value) * stepPx.value : 0;
  }
  function cellOpacity(i: number) {
    if (layoutExpanded.value) return 1;
    // Collapsed: only the center circle stays visible.
    return i === Math.round(center.value) ? 1 : 0;
  }
</script>

<template>
  <div
    ref="root"
    :class="cn('relative mx-auto outline-none', focused ? '' : '', props.class)"
    :style="{ width: `${rowWidth}px`, height: `${size}px` }"
    :tabindex="0"
    role="textbox"
    :aria-label="`${length}-character input`"
    @focus="onFocus"
    @blur="onBlur"
  >
    <component
      :is="motion.div"
      v-for="(_, i) in cells"
      :key="i"
      class="absolute top-0 flex items-center justify-center rounded-full border border-border bg-muted/60"
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        left: '50%',
        marginLeft: `${-size / 2}px`,
      }"
      :initial="false"
      :animate="{ x: cellX(i), opacity: cellOpacity(i) }"
      :transition="spring"
    >
      <!-- Active ring -->
      <span
        v-if="i === activeIndex && layoutExpanded"
        class="pointer-events-none absolute inset-0 rounded-full"
        :style="{
          boxShadow: `0 0 0 2px ${accent}`,
          outline: `1px solid ${accent}`,
          outlineOffset: '3px',
        }"
      />
      <span
        class="text-2xl font-medium tracking-wide text-foreground uppercase tabular-nums"
      >
        {{ letterAt(i) }}
      </span>
      <!-- Blinking caret in the active cell -->
      <span
        v-if="i === activeIndex && layoutExpanded"
        class="nxui-caret ml-0.5 inline-block h-6 w-0.5 rounded-full"
        :style="{ background: accent }"
      />
    </component>
  </div>
</template>

<style scoped>
  @keyframes nxui-caret-blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }
  .nxui-caret {
    animation: nxui-caret-blink 1s steps(1) infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .nxui-caret {
      animation: none;
    }
  }
</style>
