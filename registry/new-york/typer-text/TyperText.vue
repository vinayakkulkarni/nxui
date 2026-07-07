<script setup lang="ts">
  // Typer text transition: words get staggered outline boxes while a solid
  // accent cursor block sweeps across, scrambling each character through
  // random glyphs before it settles. Inspired by the "typer text transition
  // effect" by @arlanoska (arlan.me/vault).
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
  import { cn } from '~/lib/utils';
  import type { TyperTextProps } from './types';

  const props = withDefaults(defineProps<TyperTextProps>(), {
    accent: '#f97316',
    speed: 22,
    cycles: 4,
    stagger: 0.15,
    autoplay: true,
    loop: true,
    holdDuration: 1800,
    class: '',
  });

  const emit = defineEmits<{
    done: [];
  }>();

  const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const chars = computed(() => props.text.split(''));
  const words = computed(() => {
    const out: { chars: string[]; start: number }[] = [];
    let pos = 0;
    for (const word of props.text.split(' ')) {
      out.push({ chars: word.split(''), start: pos });
      pos += word.length + 1;
    }
    return out;
  });

  // ticks holds the global frame counter; each char settles once the cursor
  // has spent `cycles` frames on it, so progress = ticks / cycles chars.
  const ticks = ref(0);
  const settled = ref(false);
  const scrambleSeed = ref(0);

  const cursorIndex = computed(() =>
    settled.value ? -1 : Math.floor(ticks.value / props.cycles),
  );

  function charState(index: number): 'done' | 'cursor' | 'pending' {
    if (settled.value) return 'done';
    if (index < cursorIndex.value) return 'done';
    if (index === cursorIndex.value) return 'cursor';
    return 'pending';
  }

  function displayChar(index: number): string {
    const real = chars.value[index] ?? '';
    if (real === ' ') return '\u00A0';
    const state = charState(index);
    if (state === 'done') return real;
    if (state === 'cursor') {
      const step = ticks.value % props.cycles;
      if (step === props.cycles - 1) return real;
      return GLYPHS[
        (index * 7 + step * 13 + scrambleSeed.value) % GLYPHS.length
      ]!;
    }
    return real;
  }

  let timer: ReturnType<typeof setInterval> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function stop() {
    if (timer) clearInterval(timer);
    if (holdTimer) clearTimeout(holdTimer);
    timer = null;
    holdTimer = null;
  }

  function play() {
    stop();
    ticks.value = 0;
    settled.value = false;
    scrambleSeed.value = Math.floor(Math.random() * GLYPHS.length);
    timer = setInterval(() => {
      ticks.value += 1;
      if (cursorIndex.value >= chars.value.length) {
        stop();
        settled.value = true;
        emit('done');
        if (props.loop) {
          holdTimer = setTimeout(() => play(), props.holdDuration);
        }
      }
    }, 1000 / props.speed);
  }

  onMounted(() => {
    if (props.autoplay) play();
    else settled.value = true;
  });
  onBeforeUnmount(() => stop());

  watch(
    () => props.text,
    () => {
      if (props.autoplay) play();
    },
  );

  function boxVisible(word: { start: number; chars: string[] }): boolean {
    if (settled.value) return false;
    return cursorIndex.value >= word.start - 1;
  }

  defineExpose({ play });
</script>

<template>
  <span
    :class="cn('inline-flex flex-wrap gap-x-[0.3em] gap-y-2', props.class)"
    :aria-label="text"
    role="text"
  >
    <span
      v-for="(word, w) in words"
      :key="`${w}-${word.chars.join('')}`"
      class="relative inline-flex rounded-md px-[0.08em] transition-[outline-color] duration-300"
      :style="{
        outline: boxVisible(word)
          ? `1.5px dashed color-mix(in srgb, ${accent} 55%, transparent)`
          : '1.5px dashed transparent',
        outlineOffset: '0.06em',
        transitionDelay: `${w * stagger}s`,
      }"
    >
      <span
        v-for="(_, c) in word.chars"
        :key="c"
        class="inline-block rounded-sm tabular-nums transition-colors duration-150"
        :style="{
          color:
            charState(word.start + c) === 'cursor'
              ? '#fff'
              : charState(word.start + c) === 'pending'
                ? 'transparent'
                : 'currentColor',
          background:
            charState(word.start + c) === 'cursor' ? accent : 'transparent',
        }"
        aria-hidden="true"
      >
        {{ displayChar(word.start + c) }}
      </span>
    </span>
  </span>
</template>
