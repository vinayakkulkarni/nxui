<script setup lang="ts">
  import type { NodeCanvasSourceProps } from './types';

  const props = withDefaults(defineProps<NodeCanvasSourceProps>(), {
    icon: 'lucide:box',
    class: '',
  });

  const emit = defineEmits<{ switch: [] }>();

  function onSwitch(): void {
    emit('switch');
  }
</script>

<template>
  <div
    :class="[
      'flex size-full items-center gap-2.5 rounded-2xl border border-blue-300/70 bg-blue-500 pr-2 pl-4 text-white shadow-[0_0_28px_rgb(59_130_246/0.55),inset_0_1px_0_rgb(255_255_255/0.25)]',
      props.class,
    ]"
  >
    <Icon :name="props.icon" class="size-4.5 shrink-0" />
    <span class="min-w-0 flex-1 truncate text-base font-medium">
      {{ props.label }}
    </span>
    <button
      type="button"
      :aria-label="`Switch source, currently ${props.label}`"
      class="grid size-8 shrink-0 place-items-center rounded-lg bg-white/20 transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white"
      @click="onSwitch"
    >
      <Icon name="lucide:chevrons-up-down" class="size-4" />
    </button>
  </div>
</template>
