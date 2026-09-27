<script setup lang="ts">
  import { computed, useId } from 'vue';
  import type { ControlCardProps } from './types';

  const props = withDefaults(defineProps<ControlCardProps>(), {
    location: '',
    icon: 'power',
    stat: '',
    levelLabel: '',
    levelUnit: '%',
    color: 'var(--chart-4)',
    class: '',
  });

  const on = defineModel<boolean>('on', { default: false });
  const level = defineModel<number>('level', { default: 60 });

  const id = useId();
  const accent = computed(() => ({ '--control-accent': props.color }));

  function toggle(): void {
    on.value = !on.value;
  }

  function onLevel(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      level.value = Number(event.target.value);
    }
  }
</script>

<template>
  <article
    :class="[
      'group relative flex flex-col gap-5 overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500',
      on
        ? 'border-(--control-accent)/40 bg-white/70 shadow-[0_12px_40px_-12px_var(--control-accent)] dark:bg-white/10'
        : 'border-white/40 bg-white/40 shadow-sm dark:border-white/10 dark:bg-white/4',
      props.class,
    ]"
    :style="accent"
  >
    <div
      aria-hidden="true"
      :class="[
        'pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-(--control-accent) blur-3xl transition-opacity duration-700',
        on ? 'opacity-35' : 'opacity-0',
      ]"
    />

    <header class="relative flex items-start justify-between gap-4">
      <span
        :class="[
          'flex size-11 items-center justify-center rounded-2xl transition-colors duration-500',
          on
            ? 'bg-(--control-accent) text-white'
            : 'bg-foreground/6 text-muted-foreground',
        ]"
      >
        <Icon :name="`lucide:${props.icon}`" class="size-5" />
      </span>

      <button
        type="button"
        role="switch"
        :aria-checked="on"
        :aria-label="`${props.name} power`"
        :class="[
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          on ? 'bg-(--control-accent)' : 'bg-foreground/15',
        ]"
        @click="toggle"
      >
        <span
          :class="[
            'absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            on ? 'translate-x-5' : 'translate-x-0',
          ]"
        />
      </button>
    </header>

    <div class="relative">
      <p class="text-base font-semibold">{{ props.name }}</p>
      <p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span v-if="props.location">{{ props.location }}</span>
        <span v-if="props.location" aria-hidden="true">·</span>
        <span :class="on ? 'text-foreground' : ''">
          {{ on ? props.stat || 'On' : 'Off' }}
        </span>
      </p>
    </div>

    <div v-if="props.levelLabel" class="relative flex flex-col gap-2">
      <div
        class="flex items-center justify-between text-xs text-muted-foreground"
      >
        <label :for="id">{{ props.levelLabel }}</label>
        <span class="tabular-nums">{{ level }}{{ props.levelUnit }}</span>
      </div>
      <input
        :id="id"
        type="range"
        min="0"
        max="100"
        :value="level"
        :disabled="!on"
        class="h-1.5 w-full cursor-pointer accent-(--control-accent) disabled:cursor-not-allowed disabled:opacity-40"
        @input="onLevel"
      />
    </div>
  </article>
</template>
