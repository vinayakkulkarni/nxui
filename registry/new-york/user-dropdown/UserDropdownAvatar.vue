<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';
  import type { UserDropdownAvatarProps } from './types';

  const props = withDefaults(defineProps<UserDropdownAvatarProps>(), {
    src: undefined,
    background: undefined,
    initials: '',
    square: false,
    class: '',
  });

  const fill = computed(() =>
    props.background ? { background: props.background } : undefined,
  );
</script>

<template>
  <span
    aria-hidden="true"
    :class="
      cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-black/5 dark:ring-white/10',
        square ? 'rounded-[28%]' : 'rounded-full',
        props.class,
      )
    "
    :style="fill"
  >
    <img
      v-if="src"
      :src="src"
      alt=""
      class="size-full object-cover"
      draggable="false"
    />
    <span v-else-if="!background">{{ initials }}</span>
  </span>
</template>
