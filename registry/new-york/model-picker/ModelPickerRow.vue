<script setup lang="ts">
  import { computed } from 'vue';
  import ModelPickerBars from './ModelPickerBars.vue';
  import type { ModelPickerRowProps } from './types';

  const props = defineProps<ModelPickerRowProps>();
  const emit = defineEmits<{
    select: [key: string];
    hover: [key: string];
  }>();

  const letter = computed(
    () => props.glyph ?? props.name.charAt(0).toUpperCase(),
  );

  function onClick(): void {
    emit('select', props.itemKey);
  }

  function onEnter(): void {
    emit('hover', props.itemKey);
  }
</script>

<template>
  <button
    type="button"
    role="menuitemradio"
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
    <span
      :class="[
        'flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-xs font-medium transition-colors duration-150',
        dimmed ? 'text-muted-foreground' : 'text-foreground',
      ]"
      aria-hidden="true"
    >
      <Icon v-if="icon" :name="icon" class="size-3.5" />
      <template v-else>{{ letter }}</template>
    </span>
    <span class="min-w-0 flex-1">
      <span
        :class="[
          'flex items-center gap-1.5 text-[17px]/6 font-medium transition-colors duration-150',
          dimmed ? 'text-muted-foreground' : 'text-foreground',
        ]"
      >
        <span class="truncate">{{ name }}</span>
        <Icon
          v-if="checked"
          name="lucide:check"
          class="size-3.5 shrink-0"
          :style="{ color: accent }"
        />
      </span>
      <span
        :class="[
          'block truncate text-[15px]/5 transition-colors duration-150',
          dimmed ? 'text-muted-foreground/70' : 'text-muted-foreground',
        ]"
      >
        {{ tagline }}
      </span>
    </span>
    <span
      v-if="varies"
      class="w-52 shrink-0 text-center text-[15px] text-muted-foreground/80 max-sm:w-auto max-sm:pr-2"
    >
      Varies
    </span>
    <span v-else class="grid shrink-0 grid-cols-3 gap-2.5 max-sm:gap-1">
      <ModelPickerBars
        :value="speed ?? 0"
        :active="lit"
        :accent="accent"
        :delay="0"
        :animate="animate"
      />
      <ModelPickerBars
        :value="quality ?? 0"
        :active="lit"
        :accent="accent"
        :delay="60"
        :animate="animate"
      />
      <ModelPickerBars
        :value="cost ?? 0"
        :active="lit"
        :accent="accent"
        :delay="120"
        :animate="animate"
      />
    </span>
  </button>
</template>
