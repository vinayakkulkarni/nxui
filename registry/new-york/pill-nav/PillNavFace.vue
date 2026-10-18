<script setup lang="ts">
  import type { PillNavItem } from './types';

  defineProps<{ item: PillNavItem }>();
</script>

<template>
  <Icon
    v-if="item.icon"
    :name="item.icon"
    class="size-[1.15em] shrink-0"
    aria-hidden="true"
  />
  {{ item.label }}
</template>
