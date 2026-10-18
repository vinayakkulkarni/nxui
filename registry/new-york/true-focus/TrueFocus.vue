<script setup lang="ts">
  import { computed, onMounted, ref, shallowRef, watch } from 'vue';
  import type { ComponentPublicInstance, CSSProperties } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { TrueFocusCorner, TrueFocusProps, TrueFocusRect } from './types';

  const props = withDefaults(defineProps<TrueFocusProps>(), {
    sentence: 'True Focus',
    separator: ' ',
    manualMode: false,
    focusStyle: 'brackets',
    order: 'sequential',
    easing: 'smooth',
    blurAmount: 5,
    focusScale: 1,
    borderColor: 'green',
    highlightColor: undefined,
    glowColor: 'transparent',
    animationDuration: 0.5,
    pauseBetweenAnimations: 1,
    cornerSize: 16,
    borderWidth: 3,
    unfocusedOpacity: 1,
    class: '',
  });

  const CORNERS: TrueFocusCorner[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];
  const FRAME_GAP = 10;
  const SMOOTH_EASE = [0.65, 0, 0.35, 1];
  const SMOOTH_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const SPRING_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  const containerRef = ref<HTMLElement | null>(null);
  const wordRefs = shallowRef<(HTMLElement | null)[]>([]);
  const currentIndex = ref(0);
  const focusRect = ref<TrueFocusRect | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const words = computed(() =>
    props.sentence.split(props.separator).filter((word) => word.trim() !== ''),
  );
  const reduce = computed(() => reducedMotion.value === 'reduce');
  const duration = computed(() => (reduce.value ? 0 : props.animationDuration));
  const activeIndex = computed(() =>
    words.value.length ? currentIndex.value % words.value.length : -1,
  );
  const spring = computed(() => props.easing === 'spring' && !reduce.value);
  const transition = computed(() =>
    spring.value
      ? {
          type: 'spring' as const,
          visualDuration: duration.value,
          bounce: 0.38,
        }
      : { duration: duration.value, ease: SMOOTH_EASE },
  );

  function setWordRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ) {
    wordRefs.value[index] = el instanceof HTMLElement ? el : null;
  }

  function measure() {
    const word = wordRefs.value[activeIndex.value];
    if (!containerRef.value || !word) return;
    const next = {
      x: word.offsetLeft,
      y: word.offsetTop,
      width: word.offsetWidth,
      height: word.offsetHeight,
    };
    const prev = focusRect.value;
    if (
      prev &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height
    ) {
      return;
    }
    focusRect.value = next;
  }

  useResizeObserver(
    () => [containerRef.value, ...wordRefs.value],
    () => measure(),
  );

  onMounted(() => {
    watch(
      [activeIndex, () => props.sentence, () => props.separator],
      () => measure(),
      { immediate: true, flush: 'post' },
    );
    watch(
      [
        () => props.manualMode,
        () => props.animationDuration,
        () => props.pauseBetweenAnimations,
        () => words.value.length,
        () => props.order,
      ],
      ([manual, anim, pause, count, order], _old, onCleanup) => {
        if (manual || count < 2) return;
        const timer = setInterval(
          () => {
            const roll = Math.random();
            const current = currentIndex.value % count;
            if (order !== 'random') {
              currentIndex.value = (current + 1) % count;
              return;
            }
            const next = Math.floor(roll * (count - 1));
            currentIndex.value = next >= current ? next + 1 : next;
          },
          (anim + pause) * 1000,
        );
        onCleanup(() => clearInterval(timer));
      },
      { immediate: true },
    );
  });

  const frame = computed<TrueFocusRect | null>(() => {
    const rect = focusRect.value;
    if (!rect) return null;
    const grow = props.focusScale - 1;
    return {
      x: rect.x - (rect.width * grow) / 2,
      y: rect.y - (rect.height * grow) / 2,
      width: rect.width * props.focusScale,
      height: rect.height * props.focusScale,
    };
  });

  const corners = computed(() => {
    const f = frame.value;
    if (!f) return null;
    const right = f.x + f.width + FRAME_GAP - props.cornerSize;
    const bottom = f.y + f.height + FRAME_GAP - props.cornerSize;
    return {
      'top-left': { x: f.x - FRAME_GAP, y: f.y - FRAME_GAP },
      'top-right': { x: right, y: f.y - FRAME_GAP },
      'bottom-left': { x: f.x - FRAME_GAP, y: bottom },
      'bottom-right': { x: right, y: bottom },
    };
  });

  const shapes = computed(() => {
    const f = frame.value;
    if (!f) return null;
    return {
      box: {
        x: f.x - FRAME_GAP,
        y: f.y - FRAME_GAP,
        width: f.width + FRAME_GAP * 2,
        height: f.height + FRAME_GAP * 2,
      },
      underline: {
        x: f.x,
        y: f.y + f.height + FRAME_GAP * 0.4,
        width: f.width,
        height: props.borderWidth,
      },
      highlight: {
        x: f.x - f.height * 0.14,
        y: f.y + f.height * 0.04,
        width: f.width + f.height * 0.28,
        height: f.height * 0.92,
      },
    };
  });

  const frameStyle = computed<CSSProperties>(() => ({
    '--border-color': props.borderColor,
    '--highlight-color': `color-mix(in srgb, ${props.highlightColor ?? props.borderColor} 30%, transparent)`,
    '--glow-color': props.glowColor,
    '--corner-size': `${props.cornerSize}px`,
    '--border-width': `${props.borderWidth}px`,
  }));

  function wordStyle(index: number): CSSProperties {
    const active = index === activeIndex.value;
    return {
      filter: `blur(${active ? 0 : props.blurAmount}px)`,
      opacity: active ? 1 : props.unfocusedOpacity,
      transform:
        props.focusScale !== 1
          ? `scale(${active ? props.focusScale : 1})`
          : undefined,
      transition: `filter ${duration.value}s ease, opacity ${duration.value}s ease, transform ${duration.value}s ${spring.value ? SPRING_CSS : SMOOTH_CSS}`,
    };
  }

  function onWordEnter(index: number) {
    if (props.manualMode) currentIndex.value = index;
  }
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('focus-container', props.class)"
    :style="frameStyle"
  >
    <motion.span
      v-if="focusStyle === 'highlight' && shapes"
      class="focus-highlight"
      aria-hidden="true"
      :initial="{ ...shapes.highlight, opacity: 0 }"
      :animate="{ ...shapes.highlight, opacity: 1 }"
      :transition="transition"
    />

    <span
      v-for="(word, index) in words"
      :key="index"
      :ref="(el) => setWordRef(index, el)"
      :class="[
        'focus-word',
        { manual: manualMode, active: index === activeIndex && !manualMode },
      ]"
      :style="wordStyle(index)"
      @mouseenter="onWordEnter(index)"
    >
      {{ word }}
    </span>

    <div
      v-if="shapes && corners && focusStyle !== 'highlight'"
      class="focus-frame"
      aria-hidden="true"
    >
      <motion.span
        v-if="focusStyle === 'box'"
        class="focus-box"
        :initial="{ ...shapes.box, opacity: 0 }"
        :animate="{ ...shapes.box, opacity: 1 }"
        :transition="transition"
      />
      <motion.span
        v-else-if="focusStyle === 'underline'"
        class="focus-underline"
        :initial="{ ...shapes.underline, opacity: 0 }"
        :animate="{ ...shapes.underline, opacity: 1 }"
        :transition="transition"
      />
      <template v-else>
        <motion.span
          v-for="corner in CORNERS"
          :key="corner"
          :class="['corner', corner]"
          :initial="{ ...corners[corner], opacity: 0 }"
          :animate="{ ...corners[corner], opacity: 1 }"
          :transition="transition"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .focus-container {
    position: relative;
    display: flex;
    gap: 1em;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    outline: none;
    user-select: none;
  }

  .focus-word {
    position: relative;
    font-size: 3rem;
    font-weight: 900;
    cursor: pointer;
    transition:
      filter 0.3s ease,
      color 0.3s ease;
    outline: none;
    user-select: none;
  }

  .focus-word.active {
    filter: blur(0);
  }

  .focus-frame {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .focus-highlight {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 6px;
    background-color: var(--highlight-color);
    pointer-events: none;
  }

  .focus-box {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    border: var(--border-width, 3px) solid var(--border-color, currentColor);
    border-radius: 6px;
    filter: drop-shadow(0 0 4px var(--glow-color, transparent));
  }

  .focus-underline {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: calc(var(--border-width, 3px) / 2);
    background-color: var(--border-color, currentColor);
    filter: drop-shadow(0 0 4px var(--glow-color, transparent));
  }

  .corner {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    width: var(--corner-size, 1rem);
    height: var(--corner-size, 1rem);
    border: var(--border-width, 3px) solid var(--border-color, currentColor);
    border-radius: 3px;
    filter: drop-shadow(0 0 4px var(--glow-color, transparent));
  }

  .top-left {
    border-right: none;
    border-bottom: none;
  }

  .top-right {
    border-left: none;
    border-bottom: none;
  }

  .bottom-left {
    border-right: none;
    border-top: none;
  }

  .bottom-right {
    border-left: none;
    border-top: none;
  }
</style>
