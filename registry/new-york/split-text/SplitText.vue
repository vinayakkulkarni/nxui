<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import { useEventListener, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createSplitTextEngine } from './split-text-engine';
  import type { CSSProperties } from 'vue';
  import type { SplitTextEngine } from './split-text-engine';
  import type { SplitTextProps, SplitTextWord } from './types';

  const props = withDefaults(defineProps<SplitTextProps>(), {
    tag: 'p',
    delay: 50,
    duration: 1.25,
    ease: undefined,
    splitType: 'chars',
    from: undefined,
    to: undefined,
    threshold: 0.1,
    rootMargin: '-100px',
    textAlign: 'center',
    staggerFrom: 'start',
    mask: false,
    effect: 'rise',
    trigger: 'view',
    loop: false,
    loopDelay: 1.5,
    hoverEffect: 'none',
    color: undefined,
    accentColor: undefined,
    class: '',
  });

  const emit = defineEmits<{
    'letter-animation-complete': [];
  }>();

  const root = ref<HTMLElement | null>(null);
  const engine = shallowRef<SplitTextEngine | null>(null);
  const ready = ref(false);
  const lineGroups = ref<string[] | null>(null);
  let completedText: string | null = null;
  let played = false;
  let mounted = false;
  let lastWidth = 0;
  let generation = 0;

  const unit = computed(() =>
    props.splitType.includes('chars')
      ? 'chars'
      : props.splitType.includes('words')
        ? 'words'
        : 'lines',
  );

  const words = computed<SplitTextWord[]>(() =>
    props.text.split(' ').map((word, index) => ({
      key: `${index}-${word}`,
      text: word,
      chars: Array.from(word),
    })),
  );

  const clip = computed(
    () =>
      props.hoverEffect === 'none' &&
      (props.from !== undefined ||
        props.to !== undefined ||
        props.effect === 'rise' ||
        props.effect === 'fade'),
  );

  const rootStyle = computed<CSSProperties>(() => ({
    textAlign: props.textAlign,
    overflow: clip.value ? 'hidden' : 'visible',
    display: 'inline-block',
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    color: props.color,
    cursor: props.trigger === 'click' ? 'pointer' : undefined,
    visibility: ready.value ? undefined : 'hidden',
  }));

  const maskClass = computed(() =>
    props.mask ? 'inline-block overflow-hidden align-bottom' : 'contents',
  );

  function prefersReduced() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function finish() {
    if (completedText === props.text) return;
    completedText = props.text;
    emit('letter-animation-complete');
  }

  function marginPx(el: HTMLElement): number {
    const match = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(
      props.rootMargin.trim(),
    );
    if (!match) return 0;
    const value = Number.parseFloat(match[1] ?? '0');
    switch (match[2]) {
      case 'em':
        return value * (Number.parseFloat(getComputedStyle(el).fontSize) || 16);
      case 'rem':
        return (
          value *
          (Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ) || 16)
        );
      case '%':
        return (value / 100) * window.innerHeight;
      default:
        return value;
    }
  }

  // ScrollTrigger start "top <(1 - threshold) * 100%><rootMargin>", once.
  function checkInView() {
    const el = root.value;
    if (!el || played || !engine.value || props.trigger === 'load') return;
    const line = window.innerHeight * (1 - props.threshold) + marginPx(el);
    if (el.getBoundingClientRect().top <= line) {
      played = true;
      engine.value.play();
    }
  }

  function measureLines() {
    const el = root.value;
    if (!el) return;
    const groups: string[] = [];
    let top = Number.NaN;
    for (const node of el.querySelectorAll<HTMLElement>(
      '[data-split-measure]',
    )) {
      const word = node.textContent ?? '';
      if (node.offsetTop !== top || !groups.length) {
        top = node.offsetTop;
        groups.push(word);
      } else {
        groups[groups.length - 1] += ` ${word}`;
      }
    }
    lineGroups.value = groups;
  }

  function teardown() {
    engine.value?.destroy();
    engine.value = null;
  }

  async function start() {
    const run = ++generation;
    teardown();
    played = false;
    const el = root.value;
    if (!el || !props.text) return;
    if (document.fonts && document.fonts.status !== 'loaded') {
      await document.fonts.ready;
    }
    if (run !== generation) return;
    if (prefersReduced()) {
      ready.value = true;
      finish();
      return;
    }
    if (unit.value === 'lines') {
      lineGroups.value = null;
      await nextTick();
      measureLines();
    }
    await nextTick();
    if (run !== generation) return;
    const pieces = [...el.querySelectorAll<HTMLElement>('[data-split-piece]')];
    const masks = props.mask
      ? [...el.querySelectorAll<HTMLElement>('[data-split-mask]')]
      : [];
    engine.value = createSplitTextEngine(el, {
      pieces,
      movers: masks.length === pieces.length && masks.length ? masks : pieces,
      effect: props.effect,
      from: props.from,
      to: props.to,
      ease: props.ease,
      delay: props.delay,
      duration: props.duration,
      staggerFrom: props.staggerFrom,
      loop: props.loop,
      loopDelay: props.loopDelay,
      revealed: completedText === props.text,
      live: () => ({
        trigger: props.trigger,
        hoverEffect: props.hoverEffect,
        accentColor: props.accentColor,
      }),
      onFinish: finish,
    });
    ready.value = true;
    if (completedText === props.text) {
      played = true;
    } else if (props.trigger === 'load') {
      played = true;
      engine.value.play();
    } else {
      checkInView();
    }
  }

  onMounted(() => {
    mounted = true;
    void start();
  });

  watch(
    [
      () => props.text,
      () => props.delay,
      () => props.duration,
      () => props.ease,
      () => props.splitType,
      () => JSON.stringify(props.from),
      () => JSON.stringify(props.to),
      () => props.threshold,
      () => props.rootMargin,
      () => props.staggerFrom,
      () => props.mask,
      () => props.effect,
      () => props.trigger,
      () => props.loop,
      () => props.loopDelay,
    ],
    () => {
      if (mounted) void start();
    },
  );

  useEventListener('scroll', checkInView, { capture: true, passive: true });
  useEventListener('resize', checkInView, { passive: true });

  useResizeObserver(
    () => root.value?.parentElement ?? null,
    (entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastWidth) < 1) return;
      const first = lastWidth === 0;
      lastWidth = width;
      if (!first && unit.value === 'lines' && mounted) void start();
    },
  );

  onBeforeUnmount(() => {
    generation++;
    teardown();
  });

  function onEnter(event: PointerEvent) {
    engine.value?.enter(event);
  }
  function onMove(event: PointerEvent) {
    engine.value?.move(event);
  }
  function onLeave() {
    engine.value?.leave();
  }
  function onClick() {
    engine.value?.click();
  }
</script>

<template>
  <component
    :is="tag"
    ref="root"
    :class="cn('split-parent', props.class)"
    :style="rootStyle"
    @pointerenter="onEnter"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @click="onClick"
  >
    <template v-if="unit === 'lines'">
      <template v-if="lineGroups">
        <span
          v-for="(line, li) in lineGroups"
          :key="`${li}-${line}`"
          :class="mask ? 'block overflow-hidden' : 'contents'"
          :data-split-mask="mask ? '' : undefined"
        >
          <span data-split-piece class="split-line block">{{ line }}</span>
        </span>
      </template>
      <template v-else>
        <template v-for="(word, wi) in words" :key="word.key">
          <span data-split-measure class="inline-block">{{ word.text }}</span
          >{{ wi < words.length - 1 ? ' ' : '' }}
        </template>
      </template>
    </template>
    <template v-else>
      <template v-for="(word, wi) in words" :key="word.key">
        <span
          v-if="unit === 'words'"
          :class="maskClass"
          :data-split-mask="mask ? '' : undefined"
        >
          <span data-split-piece class="split-word inline-block">{{
            word.text
          }}</span>
        </span>
        <span v-else class="split-word inline-block whitespace-nowrap">
          <span
            v-for="(char, ci) in word.chars"
            :key="ci"
            :class="maskClass"
            :data-split-mask="mask ? '' : undefined"
          >
            <span data-split-piece class="split-char inline-block">{{
              char
            }}</span>
          </span>
        </span>
        {{ wi < words.length - 1 ? ' ' : '' }}
      </template>
    </template>
  </component>
</template>
