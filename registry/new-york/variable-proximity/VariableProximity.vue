<script setup lang="ts">
  import { useRafFn, useEventListener, defaultWindow } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      label: string;
      fromFontVariationSettings: string;
      toFontVariationSettings: string;
      containerRef: HTMLElement | null;
      radius?: number;
      falloff?: 'linear' | 'exponential' | 'gaussian';
      class?: string;
    }>(),
    {
      radius: 50,
      falloff: 'linear',
      class: '',
    },
  );

  const letterRefs = ref<(HTMLSpanElement | null)[]>([]);
  const mousePos = ref({ x: 0, y: 0 });

  useEventListener(defaultWindow, 'mousemove', (e: MouseEvent) => {
    if (!props.containerRef) return;
    const rect = props.containerRef.getBoundingClientRect();
    mousePos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });

  useEventListener(defaultWindow, 'touchmove', (e: TouchEvent) => {
    if (!props.containerRef || !e.touches[0]) return;
    const rect = props.containerRef.getBoundingClientRect();
    mousePos.value = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  });

  function parseSettings(str: string): Map<string, number> {
    return new Map(
      str
        .split(',')
        .map((s) => s.trim())
        .map((s) => {
          const [name, value] = s.split(' ');
          return [
            (name ?? '').replace(/['"]/g, ''),
            Number.parseFloat(value ?? '0'),
          ];
        }),
    );
  }

  const parsedAxes = computed(() => {
    const from = parseSettings(props.fromFontVariationSettings);
    const to = parseSettings(props.toFontVariationSettings);
    return Array.from(from.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: to.get(axis) ?? fromValue,
    }));
  });

  function calculateFalloff(distance: number): number {
    const norm = Math.min(Math.max(1 - distance / props.radius, 0), 1);
    if (props.falloff === 'exponential') return norm ** 2;
    if (props.falloff === 'gaussian') {
      return Math.exp(-((distance / (props.radius / 2)) ** 2) / 2);
    }
    return norm;
  }

  useRafFn(() => {
    if (!props.containerRef) return;
    const containerRect = props.containerRef.getBoundingClientRect();

    letterRefs.value.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - containerRect.left;
      const cy = rect.top + rect.height / 2 - containerRect.top;
      const dx = mousePos.value.x - cx;
      const dy = mousePos.value.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= props.radius) {
        el.style.fontVariationSettings = props.fromFontVariationSettings;
        return;
      }

      const f = calculateFalloff(dist);
      const settings = parsedAxes.value
        .map(({ axis, fromValue, toValue }) => {
          const v = fromValue + (toValue - fromValue) * f;
          return `'${axis}' ${v}`;
        })
        .join(', ');

      el.style.fontVariationSettings = settings;
    });
  });

  const words = computed(() => props.label.split(' '));

  function setLetterRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ) {
    letterRefs.value[index] = el as HTMLSpanElement | null;
  }
</script>

<template>
  <span :class="cn('inline', props.class)">
    <span
      v-for="(word, wi) in words"
      :key="wi"
      class="inline-block whitespace-nowrap"
    >
      <span
        v-for="(letter, li) in word.split('')"
        :key="li"
        :ref="(el) => setLetterRef(words.slice(0, wi).join('').length + li, el)"
        class="inline-block"
        aria-hidden="true"
        >{{ letter }}</span
      >
      <span v-if="wi < words.length - 1" class="inline-block">&nbsp;</span>
    </span>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>
