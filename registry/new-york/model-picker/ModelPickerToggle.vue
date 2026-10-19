<script setup lang="ts">
  import type { ModelPickerToggleProps } from './types';

  const props = defineProps<ModelPickerToggleProps>();
  const emit = defineEmits<{
    toggle: [key: string];
    hover: [key: string];
  }>();

  function onClick(): void {
    emit('toggle', props.itemKey);
  }

  function onEnter(): void {
    emit('hover', props.itemKey);
  }
</script>

<template>
  <button
    type="button"
    role="menuitemcheckbox"
    tabindex="-1"
    data-mp-item
    :data-key="itemKey"
    :aria-checked="checked"
    :class="[
      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none',
      'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/60',
      active ? 'bg-foreground/7 dark:bg-foreground/8' : '',
    ]"
    @click="onClick"
    @pointerenter="onEnter"
  >
    <span class="flex size-8 shrink-0 items-center justify-center">
      <Icon :name="icon" class="size-4.5 text-muted-foreground" />
    </span>
    <span class="flex-1 text-[17px]/6 text-foreground">{{ label }}</span>
    <span
      :class="[
        'relative h-5 w-8.5 shrink-0 rounded-full transition-colors duration-200',
        checked ? '' : 'bg-foreground/12 dark:bg-foreground/16',
      ]"
      :style="{ backgroundColor: checked ? accent : '' }"
      aria-hidden="true"
    >
      <span
        :class="[
          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-3.5' : 'translate-x-0',
        ]"
      />
    </span>
  </button>
</template>
