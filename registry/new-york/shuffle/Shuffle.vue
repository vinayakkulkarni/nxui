<script setup lang="ts">
  import { useIntervalFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      duration?: number;
      characters?: string;
      class?: string;
    }>(),
    {
      duration: 800,
      characters:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
      class: '',
    },
  );

  const displayText = ref(props.text.split('').map(() => randomChar()));
  const revealed = ref(0);
  const isComplete = ref(false);

  function randomChar(): string {
    return props.characters[
      Math.floor(Math.random() * props.characters.length)
    ];
  }

  const intervalMs = computed(() =>
    Math.max(16, props.duration / (props.text.length * 6)),
  );

  const { pause } = useIntervalFn(
    () => {
      if (revealed.value >= props.text.length) {
        isComplete.value = true;
        pause();
        return;
      }

      displayText.value = props.text.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < revealed.value) return props.text[i] ?? '';
        return randomChar();
      });

      revealed.value += 0.3;
    },
    intervalMs,
    { immediate: true },
  );
</script>

<template>
  <span :class="cn('inline-flex font-mono', props.class)">
    <span
      v-for="(char, i) in displayText"
      :key="i"
      class="inline-block min-w-[0.1em] text-foreground transition-opacity duration-150"
      :class="i < revealed ? 'opacity-100' : 'opacity-70'"
    >
      {{ char }}
    </span>
  </span>
</template>
