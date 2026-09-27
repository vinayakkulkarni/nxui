<script setup lang="ts">
  import { computed } from 'vue';
  import type { ControlCardProps } from './types';

  const props = withDefaults(defineProps<ControlCardProps>(), {
    stat: undefined,
    color: 'oklch(0.55 0.22 264)',
    class: '',
  });

  const on = defineModel<boolean>('on', { default: false });

  const accent = computed(() => ({ '--control-accent': props.color }));

  function toggle(): void {
    on.value = !on.value;
  }
</script>

<template>
  <article
    :class="[
      'flex flex-col gap-6 rounded-3xl border border-white/30 bg-white/12 p-5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] backdrop-blur-2xl backdrop-saturate-150',
      props.class,
    ]"
    :style="accent"
  >
    <header class="flex items-start justify-between gap-4">
      <Icon :name="`lucide:${props.icon}`" class="mt-1 size-7 text-white/90" />
      <button
        type="button"
        role="switch"
        :aria-checked="on"
        :aria-label="`${props.name} power`"
        :class="[
          'flex size-12 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          on
            ? 'bg-(--control-accent) text-white shadow-[0_6px_20px_-6px_var(--control-accent)]'
            : 'border border-white/30 bg-white/15 text-white/80 hover:bg-white/25',
        ]"
        @click="toggle"
      >
        <Icon :name="on ? 'lucide:power' : 'lucide:power-off'" class="size-5" />
      </button>
    </header>

    <div>
      <p class="text-sm text-white/70">{{ props.category }}</p>
      <p class="mt-1 truncate text-xl font-medium">{{ props.name }}</p>
    </div>

    <div v-if="props.stat" class="flex items-center gap-3">
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10"
      >
        <Icon
          :name="`lucide:${props.stat.icon}`"
          class="size-5 text-white/90"
        />
      </span>
      <div class="min-w-0">
        <p class="truncate text-base font-medium tabular-nums">
          {{ props.stat.value }}
        </p>
        <p class="truncate text-sm text-white/65">{{ props.stat.label }}</p>
      </div>
    </div>
  </article>
</template>
