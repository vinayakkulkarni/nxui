<script setup lang="ts">
  import type { Ref } from 'vue';
  import type { MacKeyboardKeyProps } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<MacKeyboardKeyProps>(), {
    label: '',
    subLabel: '',
    icon: '',
    iconLabel: '',
    width: 1,
    keyCode: '',
    noAspectRatio: false,
  });

  const SYMBOL_KEY_MAP: Record<string, string> = {
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    '`': 'Backquote',
    '-': 'Minus',
    '=': 'Equal',
  };

  const resolvedKeyCode = computed(() => {
    if (props.keyCode) return props.keyCode;
    const label = props.label;
    if (!label) return '';
    if (label.length === 1) {
      if (/^[a-z]$/i.test(label)) return `Key${label.toUpperCase()}`;
      if (/^\d$/.test(label)) return `Digit${label}`;
      if (SYMBOL_KEY_MAP[label]) return SYMBOL_KEY_MAP[label]!;
    }
    return '';
  });

  const activeKeys = inject<Ref<Set<string>>>('mac-keyboard-active-keys');
  const playSound = inject<() => void>('mac-keyboard-play-sound');

  const isActive = computed(() => {
    if (!resolvedKeyCode.value || !activeKeys?.value) return false;
    return activeKeys.value.has(resolvedKeyCode.value);
  });

  // Trigger sound on key press
  watch(isActive, (pressed) => {
    if (pressed) playSound?.();
  });
</script>

<template>
  <button
    :class="
      cn(
        'relative flex flex-col items-center justify-center rounded-sm',
        'border border-zinc-300 dark:border-zinc-600',
        'bg-white dark:bg-zinc-800',
        'shadow-sm shadow-zinc-400/50 dark:shadow-black/50',
        'text-zinc-800 dark:text-zinc-200',
        'transition-all duration-75 select-none',
        'cursor-default outline-none',
        isActive && [
          'translate-y-px scale-[0.98] shadow-none',
          'bg-zinc-100 dark:bg-zinc-700',
        ],
      )
    "
    :style="{
      flex: `${width} 0 0%`,
      minHeight: noAspectRatio ? undefined : '36px',
      aspectRatio: noAspectRatio ? undefined : `${width} / 1`,
    }"
    tabindex="-1"
  >
    <!-- Sub label (top-left, e.g. shifted char) -->
    <span
      v-if="subLabel"
      class="absolute top-1 left-1.5 text-[9px] leading-none text-zinc-400 dark:text-zinc-500"
    >
      {{ subLabel }}
    </span>

    <!-- Icon -->
    <Icon
      v-if="icon"
      :name="icon"
      class="size-3.5 text-zinc-600 dark:text-zinc-300"
    />

    <!-- Icon label (below icon) -->
    <span
      v-if="iconLabel"
      class="mt-0.5 text-[9px] leading-none text-zinc-500 dark:text-zinc-400"
    >
      {{ iconLabel }}
    </span>

    <!-- Text label -->
    <span
      v-if="label && !icon"
      :class="
        cn(
          'leading-none',
          label.length === 1
            ? 'text-xs font-medium'
            : 'text-[9px] font-normal text-zinc-500 dark:text-zinc-400',
        )
      "
    >
      {{ label }}
    </span>
  </button>
</template>
