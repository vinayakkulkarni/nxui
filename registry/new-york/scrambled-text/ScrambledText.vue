<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      radius?: number;
      speed?: number;
      scrambleChars?: string;
      class?: string;
    }>(),
    {
      radius: 100,
      speed: 50,
      scrambleChars: '.:!?#*&@^$~',
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const charRefs = ref<(HTMLSpanElement | null)[]>([]);
  const originalChars = computed(() => props.text.split(''));
  const displayChars = ref(props.text.split(''));

  const scrambleTimers = new Map<number, ReturnType<typeof setTimeout>>();

  useEventListener(el, 'pointermove', (e: PointerEvent) => {
    if (!el.value) return;

    charRefs.value.forEach((span, i) => {
      if (!span) return;
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < props.radius) {
        scrambleChar(i);
      }
    });
  });

  function scrambleChar(index: number) {
    if (scrambleTimers.has(index)) return;

    const original = originalChars.value[index] ?? '';
    if (original === ' ') return;

    let step = 0;
    const maxSteps = Math.ceil(props.speed / 16);

    function tick() {
      if (step >= maxSteps) {
        displayChars.value[index] = original;
        scrambleTimers.delete(index);
        return;
      }

      const chars = props.scrambleChars;
      displayChars.value[index] =
        chars[Math.floor(Math.random() * chars.length)] ?? '.';
      step++;
      scrambleTimers.set(index, setTimeout(tick, 16));
    }

    tick();
  }

  function setCharRef(i: number, el: Element | ComponentPublicInstance | null) {
    charRefs.value[i] = el as HTMLSpanElement | null;
  }

  onUnmounted(() => {
    scrambleTimers.forEach((timer) => clearTimeout(timer));
  });
</script>

<template>
  <div
    ref="el"
    :class="
      cn('font-mono text-[clamp(14px,4vw,32px)] cursor-default', props.class)
    "
  >
    <span
      v-for="(char, i) in displayChars"
      :key="i"
      :ref="(el) => setCharRef(i, el)"
      class="inline-block will-change-transform"
      >{{ char === ' ' ? '\u00A0' : char }}</span
    >
  </div>
</template>
