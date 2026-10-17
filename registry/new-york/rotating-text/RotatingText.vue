<script setup lang="ts">
  import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
  import {
    AnimatePresence,
    MotionConfig,
    animate as animateValue,
    motion,
    useMotionValue,
  } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import {
    FLIP_STYLE,
    LAYOUT_SPRING,
    ROTATING_TEXT_EFFECTS,
    WIDTH_SPRING,
    readableText,
    splitText,
    withFilter,
  } from './rotating-text-effects';
  import type { RotatingTextExpose, RotatingTextProps } from './types';

  defineOptions({ inheritAttrs: false });

  const props = withDefaults(defineProps<RotatingTextProps>(), {
    effect: 'slide',
    direction: 'up',
    highlight: false,
    highlightColor: '#a855f7',
    initial: undefined,
    animate: undefined,
    exit: undefined,
    transition: undefined,
    animatePresenceMode: 'wait',
    animatePresenceInitial: false,
    rotationInterval: 2000,
    staggerDuration: 0,
    staggerFrom: 'first',
    loop: true,
    auto: true,
    pauseOnHover: false,
    blur: 0,
    splitBy: 'characters',
    splitLevelClass: '',
    elementLevelClass: '',
    class: '',
  });

  const emit = defineEmits<{ next: [index: number] }>();

  const currentTextIndex = ref(0);
  const hovered = ref(false);
  const mounted = ref(false);
  const contentRef = useTemplateRef<HTMLElement>('content');
  const width = useMotionValue<string | number>('auto');
  const preferredMotion = usePreferredReducedMotion();
  const reduceMotion = computed(() => preferredMotion.value === 'reduce');

  const lastIndex = computed(() => Math.max(props.texts.length - 1, 0));
  const activeIndex = computed(() =>
    Math.min(currentTextIndex.value, lastIndex.value),
  );

  const elements = computed(() =>
    splitText(props.texts[activeIndex.value] ?? '', props.splitBy),
  );

  // Random stagger order is reshuffled whenever the visible text changes.
  const order = computed(() => {
    const total = elements.value.reduce(
      (sum, word) => sum + word.characters.length,
      0,
    );
    const shuffled = Array.from({ length: total }, (_, i) => i).sort(
      () => Math.random() - 0.5,
    );
    return { total, shuffled };
  });

  function getStaggerDelay(index: number): number {
    const { total, shuffled } = order.value;
    const step = props.staggerDuration;
    const from = props.staggerFrom;
    if (from === 'first') return index * step;
    if (from === 'last') return (total - 1 - index) * step;
    if (from === 'center')
      return Math.abs(Math.floor(total / 2) - index) * step;
    if (from === 'random') return (shuffled[index] ?? index) * step;
    return Math.abs(from - index) * step;
  }

  function goTo(index: number) {
    if (index === currentTextIndex.value) return;
    currentTextIndex.value = index;
    emit('next', index);
  }

  function next() {
    const current = activeIndex.value;
    const last = lastIndex.value;
    goTo(current < last ? current + 1 : props.loop ? 0 : current);
  }

  function previous() {
    const current = activeIndex.value;
    const last = lastIndex.value;
    goTo(current > 0 ? current - 1 : props.loop ? last : current);
  }

  function jumpTo(index: number) {
    goTo(Math.max(0, Math.min(index, lastIndex.value)));
  }

  function reset() {
    goTo(0);
  }

  defineExpose<RotatingTextExpose>({ next, previous, jumpTo, reset });

  const paused = computed(() => props.pauseOnHover && hovered.value);

  watch(
    [
      mounted,
      () => props.auto,
      paused,
      () => props.rotationInterval,
      () => props.loop,
      activeIndex,
      lastIndex,
    ],
    (_, __, onCleanup) => {
      if (!mounted.value || !props.auto || paused.value) return;
      const id = setTimeout(next, props.rotationInterval);
      onCleanup(() => clearTimeout(id));
    },
  );

  onMounted(() => (mounted.value = true));

  // ── Highlight block springs its width to fit each new text ───────────
  let widthControls: AnimationPlaybackControls | null = null;
  let settled = false;

  function fit() {
    const content = contentRef.value;
    if (!props.highlight || !content) return;
    const target = content.offsetWidth + 1;
    widthControls?.stop();
    if (!settled || reduceMotion.value) {
      settled = true;
      width.set(target);
      return;
    }
    widthControls = animateValue(width, target, WIDTH_SPRING);
  }

  watch(
    [() => props.highlight, contentRef],
    () => {
      widthControls?.stop();
      settled = false;
      if (!props.highlight) width.set('auto');
      else fit();
    },
    { flush: 'post' },
  );
  useResizeObserver(contentRef, fit);

  function onMouseEnter() {
    if (props.pauseOnHover) hovered.value = true;
  }

  function onMouseLeave() {
    hovered.value = false;
  }

  const preset = computed(() =>
    (ROTATING_TEXT_EFFECTS[props.effect] ?? ROTATING_TEXT_EFFECTS.slide)(
      props.direction !== 'down',
    ),
  );
  const blurAmount = computed(() =>
    props.blur > 0 ? props.blur : props.effect === 'blur' ? 10 : 0,
  );
  const enterFrom = computed(() => {
    const state = props.initial ?? preset.value.initial;
    return blurAmount.value > 0
      ? withFilter(state, `blur(${blurAmount.value}px)`)
      : state;
  });
  const enterTo = computed(() => {
    const state = props.animate ?? preset.value.animate;
    return blurAmount.value > 0 ? withFilter(state, 'blur(0px)') : state;
  });
  const leaveTo = computed(() => {
    const state = props.exit ?? preset.value.exit;
    return blurAmount.value > 0
      ? withFilter(state, `blur(${blurAmount.value}px)`)
      : state;
  });
  const charTransition = computed(
    () => props.transition ?? preset.value.transition,
  );
  const exitTransition = computed(() =>
    props.transition || props.exit ? undefined : preset.value.exitTransition,
  );
  const charStyle = computed(() =>
    props.effect === 'flip' ? FLIP_STYLE : undefined,
  );

  /** Letters grouped per word, each with its stagger delay. */
  const words = computed(() => {
    let count = 0;
    return elements.value.map((word, wordIndex) => ({
      key: wordIndex,
      needsSpace: word.needsSpace,
      characters: word.characters.map((char, charIndex) => ({
        key: charIndex,
        char,
        delay: getStaggerDelay(count++),
      })),
    }));
  });

  function charExit(delay: number) {
    const timing = exitTransition.value;
    return timing
      ? { ...leaveTo.value, transition: { ...timing, delay } }
      : leaveTo.value;
  }

  function charEnter(delay: number) {
    return { ...charTransition.value, delay };
  }

  const blockStyle = computed(() =>
    props.highlight
      ? {
          width,
          backgroundColor: props.highlightColor,
          color: readableText(props.highlightColor),
        }
      : undefined,
  );
  const innerClass = computed(() =>
    props.splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate',
  );
</script>

<template>
  <MotionConfig reduced-motion="user">
    <motion.span
      v-bind="$attrs"
      :class="[
        'text-rotate',
        highlight && 'text-rotate-highlight',
        props.class,
      ]"
      :style="blockStyle"
      :layout="!highlight"
      :transition="transition ?? LAYOUT_SPRING"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <span class="text-rotate-sr-only">{{ texts[activeIndex] }}</span>
      <span
        ref="content"
        :class="
          highlight ? 'text-rotate-highlight-content' : 'text-rotate-contents'
        "
      >
        <AnimatePresence
          :mode="animatePresenceMode"
          :initial="animatePresenceInitial"
        >
          <motion.span
            :key="activeIndex"
            :class="innerClass"
            :layout="!highlight"
            aria-hidden="true"
          >
            <span
              v-for="word in words"
              :key="word.key"
              :class="['text-rotate-word', splitLevelClass]"
            >
              <motion.span
                v-for="item in word.characters"
                :key="item.key"
                :initial="enterFrom"
                :animate="enterTo"
                :exit="charExit(item.delay)"
                :transition="charEnter(item.delay)"
                :class="['text-rotate-element', elementLevelClass]"
                :style="charStyle"
                >{{ item.char }}</motion.span
              ><span v-if="word.needsSpace" class="text-rotate-space"> </span>
            </span>
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.span>
  </MotionConfig>
</template>

<style scoped>
  .text-rotate {
    display: flex;
    flex-wrap: wrap;
    white-space: pre-wrap;
    position: relative;
  }

  .text-rotate-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-rotate-word {
    display: inline-flex;
  }

  .text-rotate-lines {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .text-rotate-element {
    display: inline-block;
  }

  .text-rotate-space {
    white-space: pre;
  }

  .text-rotate-contents {
    display: contents;
  }

  .text-rotate-highlight {
    box-sizing: content-box;
    flex-wrap: nowrap;
    justify-content: center;
    overflow: hidden;
    padding: 0.1em 0.28em;
    border-radius: 0.16em;
  }

  .text-rotate-highlight-content {
    display: flex;
    flex-shrink: 0;
    white-space: pre;
  }
</style>
