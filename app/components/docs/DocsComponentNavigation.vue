<script setup lang="ts">
  import type { NavItem } from '~/types/docs';

  defineProps<{
    prev: NavItem | null;
    next: NavItem | null;
  }>();
</script>

<template>
  <div>
    <DocsComponentEditLinks />
    <DocsComponentPrevNext :prev="prev" :next="next" />
  </div>
</template>
