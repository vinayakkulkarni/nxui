<script setup lang="ts">
  import type { NodeCanvasCardProps } from './types';

  const props = withDefaults(defineProps<NodeCanvasCardProps>(), {
    iconClass: 'text-muted-foreground',
    class: '',
  });
</script>

<template>
  <section
    :aria-label="props.title"
    :class="[
      'flex size-full flex-col rounded-3xl border bg-card p-5 text-card-foreground shadow-[0_10px_30px_rgb(0_0_0/0.18)]',
      props.class,
    ]"
  >
    <h3 class="flex items-center gap-2 text-[15px] text-muted-foreground">
      <Icon
        v-if="props.icon"
        :name="props.icon"
        :class="['size-4', props.iconClass]"
      />
      {{ props.title }}
    </h3>
    <div class="mt-4 min-h-0 flex-1">
      <slot />
    </div>
  </section>
</template>
