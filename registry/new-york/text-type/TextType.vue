<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { Directive } from 'vue';
  import { animate, useMotionValue } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    GLIDE_EASE,
    TEXT_TYPE_EFFECTS,
    blinkKeyframes,
    graphemes,
    typoFor,
  } from './text-type-effects';
  import type { TextTypeEffect, TextTypeProps, TextTypeTypo } from './types';

  const props = withDefaults(defineProps<TextTypeProps>(), {
    as: 'div',
    typingSpeed: 50,
    initialDelay: 0,
    pauseDuration: 2000,
    deletingSpeed: 30,
    deleteMode: 'backspace',
    loop: true,
    showCursor: true,
    hideCursorWhileTyping: false,
    cursorStyle: 'character',
    cursorCharacter: '|',
    cursorColor: 'currentColor',
    cursorClass: '',
    cursorBlinkDuration: 0.5,
    cursorGlide: true,
    typeEffect: 'none',
    mistakes: 0,
    prefix: '',
    prefixColor: 'currentColor',
    textColors: () => [],
    variableSpeed: undefined,
    startOnVisible: false,
    reverseMode: false,
    class: '',
  });

  const emit = defineEmits<{
    'sentence-complete': [sentence: string, index: number];
  }>();

  const textIndex = ref(0);
  const count = ref(0);
  const selected = ref(0);
  const typo = shallowRef<TextTypeTypo | null>(null);
  const isDeleting = ref(false);
  const isVisible = ref(false);
  const preferredMotion = usePreferredReducedMotion();
  const reduceMotion = computed(() => preferredMotion.value === 'reduce');

  const containerRef = useTemplateRef<HTMLElement>('container');
  const caretRef = useTemplateRef<HTMLElement>('caret');
  const cursorRef = useTemplateRef<HTMLElement>('cursor');
  const blinkRef = useTemplateRef<HTMLElement>('blink');

  const textKey = computed(() =>
    Array.isArray(props.text) ? props.text.join('\u0000') : props.text,
  );
  const textArray = computed(() => textKey.value.split('\u0000'));
  const index = computed(() => textIndex.value % textArray.value.length);
  const chars = computed(() => graphemes(textArray.value[index.value] ?? ''));
  const total = computed(() => chars.value.length);
  const shown = computed(() => Math.min(count.value, total.value));
  const minSpeed = computed(
    () => props.variableSpeed?.min ?? props.typingSpeed,
  );
  const maxSpeed = computed(
    () => props.variableSpeed?.max ?? props.typingSpeed,
  );
  const glideTime = computed(() => {
    const pace = (minSpeed.value + maxSpeed.value) / 2;
    return Math.min(0.18, Math.max(0.06, pace * 0.0016));
  });

  if (props.startOnVisible) {
    const { stop } = useIntersectionObserver(
      containerRef,
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        isVisible.value = true;
        stop();
      },
      { threshold: 0.1 },
    );
  }

  onMounted(() => {
    if (!props.startOnVisible) isVisible.value = true;
  });

  // ── Typing state machine: one pending timeout per state ──────────────
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastTypo = -1;

  function wait(ms: number, next: () => void) {
    timeout = setTimeout(next, ms);
  }

  function speed() {
    return minSpeed.value + Math.random() * (maxSpeed.value - minSpeed.value);
  }

  function stepTyping() {
    const current = typo.value;
    if (current) {
      if (reduceMotion.value) {
        wait(0, () => (typo.value = null));
      } else if (!current.fixing) {
        if (current.tail.length < current.plan.length) {
          wait(speed(), () => {
            typo.value = {
              ...current,
              tail: current.plan.slice(0, current.tail.length + 1),
            };
          });
        } else {
          wait(260 + Math.random() * 320, () => {
            typo.value = { ...current, fixing: true };
          });
        }
      } else if (current.tail.length) {
        wait(Math.max(45, props.deletingSpeed), () => {
          typo.value = { ...current, tail: current.tail.slice(0, -1) };
        });
      } else {
        wait(90 + Math.random() * 140, () => (typo.value = null));
      }
      return;
    }

    const n = shown.value;
    const all = total.value;
    if (n < all) {
      const lead = n === 0 ? props.initialDelay : 0;
      const next = props.reverseMode ? all - n - 1 : n;
      const wrong =
        props.mistakes > 0 && n > 0 && lastTypo !== next
          ? typoFor(chars.value[next])
          : null;

      if (reduceMotion.value) {
        wait(lead, () => (count.value = all));
      } else if (wrong && Math.random() < Math.min(1, props.mistakes) * 0.16) {
        lastTypo = next;
        const plan = [wrong];
        const follow = chars.value[props.reverseMode ? next - 1 : next + 1];
        if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow);
        wait(lead + speed(), () => {
          typo.value = { plan, tail: [wrong], fixing: false };
        });
      } else {
        wait(lead + speed(), () => (count.value = n + 1));
      }
    } else if (props.loop || index.value < textArray.value.length - 1) {
      wait(props.pauseDuration, () => (isDeleting.value = true));
    }
  }

  function stepDeleting() {
    const n = shown.value;
    if (n > 0) {
      if (reduceMotion.value) {
        wait(0, () => (count.value = 0));
      } else if (props.deleteMode === 'select') {
        if (selected.value < n) {
          wait(props.deletingSpeed, () => selected.value++);
        } else {
          wait(Math.max(160, props.deletingSpeed * 8), () => {
            selected.value = 0;
            count.value = 0;
          });
        }
      } else {
        wait(props.deletingSpeed, () => (count.value = n - 1));
      }
      return;
    }
    emit('sentence-complete', textArray.value[index.value] ?? '', index.value);
    lastTypo = -1;
    selected.value = 0;
    isDeleting.value = false;
    textIndex.value = (index.value + 1) % textArray.value.length;
  }

  watch(
    [
      isVisible,
      isDeleting,
      shown,
      total,
      chars,
      selected,
      typo,
      index,
      textArray,
      () => props.loop,
      () => props.deletingSpeed,
      () => props.deleteMode,
      () => props.pauseDuration,
      () => props.initialDelay,
      minSpeed,
      maxSpeed,
      () => props.mistakes,
      () => props.reverseMode,
      reduceMotion,
    ],
    () => {
      clearTimeout(timeout);
      if (!isVisible.value) return;
      if (isDeleting.value) stepDeleting();
      else stepTyping();
    },
  );

  // ── Cursor: soft blink, glide to the caret ───────────────────────────
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  let caretPosition: { x: number; y: number } | null = null;
  let blinkAnimation: Animation | null = null;
  let blinkWake: Animation | null = null;
  let blinkResume: ReturnType<typeof setTimeout> | undefined;
  let glideX: AnimationPlaybackControls | null = null;
  let glideY: AnimationPlaybackControls | null = null;

  function paintCursor() {
    const cursor = cursorRef.value;
    if (cursor) {
      cursor.style.transform = `translate(${cursorX.get()}px, ${cursorY.get()}px)`;
    }
  }
  const offX = cursorX.on('change', paintCursor);
  const offY = cursorY.on('change', paintCursor);

  function stopBlink() {
    blinkAnimation?.cancel();
    blinkWake?.cancel();
    clearTimeout(blinkResume);
    blinkAnimation = null;
    blinkWake = null;
  }

  watch(
    [
      blinkRef,
      () => props.showCursor,
      () => props.cursorBlinkDuration,
      reduceMotion,
    ],
    () => {
      stopBlink();
      const blink = blinkRef.value;
      if (!props.showCursor || !blink) return;
      if (reduceMotion.value || props.cursorBlinkDuration <= 0) return;
      blinkAnimation = blink.animate(blinkKeyframes(), {
        duration: props.cursorBlinkDuration * 2000,
        iterations: Infinity,
      });
    },
    { flush: 'post' },
  );

  watch(
    () => props.showCursor,
    () => (caretPosition = null),
  );

  function wakeBlink() {
    const blink = blinkRef.value;
    if (!blinkAnimation || !blink) return;
    const from = Number(getComputedStyle(blink).opacity);
    blinkAnimation.pause();
    blinkAnimation.currentTime = 0;
    blinkWake?.cancel();
    blinkWake = blink.animate([{ opacity: from }, { opacity: 1 }], {
      duration: 120,
      easing: 'ease-out',
      fill: 'forwards',
    });
    clearTimeout(blinkResume);
    blinkResume = setTimeout(() => {
      blinkWake?.cancel();
      blinkWake = null;
      blinkAnimation?.play();
    }, 120);
  }

  function placeCursor(instant: boolean) {
    const caret = caretRef.value;
    const cursor = cursorRef.value;
    if (!caret || !cursor) return;

    const x = caret.offsetLeft;
    const y = caret.offsetTop;
    const last = caretPosition;
    if (last && Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) {
      return;
    }
    caretPosition = { x, y };

    glideX?.stop();
    glideY?.stop();
    if (
      instant ||
      !last ||
      !props.cursorGlide ||
      reduceMotion.value ||
      Math.abs(last.y - y) > 1
    ) {
      cursorX.jump(x);
      cursorY.jump(y);
      paintCursor();
    } else {
      const options = { duration: glideTime.value, ease: GLIDE_EASE };
      glideX = animate(cursorX, x, options);
      glideY = animate(cursorY, y, options);
    }

    if (!instant) wakeBlink();
  }

  onMounted(() => placeCursor(false));
  onUpdated(() => placeCursor(false));
  useResizeObserver(containerRef, () => placeCursor(true));

  onBeforeUnmount(() => {
    clearTimeout(timeout);
    stopBlink();
    glideX?.stop();
    glideY?.stop();
    offX();
    offY();
  });

  // ── Per-character entrance effect (runs once per new character) ─────
  const vTypeIn: Directive<HTMLElement, TextTypeEffect> = {
    mounted(el, binding) {
      const effect = TEXT_TYPE_EFFECTS[binding.value];
      if (!effect || reduceMotion.value) return;
      el.animate(effect.keyframes, effect.options);
    },
  };

  const start = computed(() =>
    props.reverseMode ? total.value - shown.value : 0,
  );
  const marked = computed(() => Math.min(selected.value, shown.value));
  const correct = computed(() =>
    chars.value
      .slice(start.value, start.value + shown.value)
      .map((char, i) => ({
        key: `c${start.value + i}`,
        char,
        selected: props.reverseMode
          ? i < marked.value
          : i >= shown.value - marked.value,
      })),
  );
  const mistyped = computed(() => {
    const list = (typo.value?.tail ?? []).map((char, i) => ({
      key: `typo-${i}`,
      char,
      selected: false,
    }));
    return props.reverseMode ? list.reverse() : list;
  });
  const visibleChars = computed(() =>
    props.reverseMode
      ? [...mistyped.value, ...correct.value]
      : [...correct.value, ...mistyped.value],
  );

  const color = computed(() =>
    props.textColors.length
      ? props.textColors[index.value % props.textColors.length]
      : 'inherit',
  );
  const typing = computed(
    () => shown.value < total.value || isDeleting.value || typo.value !== null,
  );
  const hideCursor = computed(
    () => props.hideCursorWhileTyping && typing.value,
  );
  const cursorStyleAttr = computed(() =>
    props.cursorColor && props.cursorColor !== 'currentColor'
      ? { color: props.cursorColor }
      : undefined,
  );
  const srText = computed(() => props.prefix + textArray.value.join(' '));
</script>

<template>
  <component :is="as" ref="container" :class="['text-type', props.class]">
    <span class="text-type__sr">{{ srText }}</span>
    <span class="text-type__content" aria-hidden="true">
      <span
        v-if="prefix"
        class="text-type__prefix"
        :style="{ color: prefixColor }"
        >{{ prefix }}</span
      ><span v-if="reverseMode" ref="caret" class="text-type__caret"
        >&#8203;</span
      ><span :style="{ color }"
        ><span
          v-for="item in visibleChars"
          :key="item.key"
          v-type-in="typeEffect"
          :class="[
            'text-type__char',
            item.selected && 'text-type__char--selected',
          ]"
          >{{ item.char }}</span
        ></span
      ><span v-if="!reverseMode" ref="caret" class="text-type__caret"
        >&#8203;</span
      >
    </span>
    <span
      v-if="showCursor"
      ref="cursor"
      aria-hidden="true"
      :class="[
        'text-type__cursor',
        `text-type__cursor--${cursorStyle}`,
        hideCursor && 'text-type__cursor--hidden',
        cursorClass,
      ]"
      :style="cursorStyleAttr"
    >
      <span ref="blink" class="text-type__blink">
        <slot v-if="cursorStyle === 'character'" name="cursor">{{
          cursorCharacter
        }}</slot>
        <span v-else class="text-type__shape"></span>
      </span>
    </span>
  </component>
</template>

<style scoped>
  .text-type {
    position: relative;
    display: inline-block;
    white-space: pre-wrap;
  }

  .text-type__sr {
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

  .text-type__char {
    position: relative;
  }

  .text-type__char--selected {
    background-color: color-mix(in srgb, currentColor 25%, transparent);
  }

  .text-type__caret {
    display: inline-block;
    width: 0;
  }

  .text-type__cursor {
    position: absolute;
    top: 0;
    left: 0;
    white-space: pre;
    pointer-events: none;
    transition: opacity 0.2s ease;
    will-change: transform;
  }

  .text-type__cursor--hidden {
    opacity: 0;
  }

  .text-type__blink {
    display: inline-block;
  }

  .text-type__cursor--character .text-type__blink {
    margin-left: 0.25rem;
  }

  .text-type__shape {
    display: inline-block;
    margin-left: 0.06em;
    background-color: currentColor;
  }

  .text-type__cursor--bar .text-type__shape {
    width: max(2px, 0.07em);
    height: 1.1em;
    vertical-align: -0.2em;
    border-radius: 1px;
  }

  .text-type__cursor--block .text-type__shape {
    width: 0.56em;
    height: 1.1em;
    vertical-align: -0.2em;
    border-radius: 0.06em;
  }

  .text-type__cursor--underscore .text-type__shape {
    width: 0.56em;
    height: max(2px, 0.075em);
    vertical-align: -0.12em;
    border-radius: 1px;
  }
</style>
