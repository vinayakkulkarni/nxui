<script setup lang="ts">
  import type { DocsMobileSheetProps } from '~/types/components';

  defineProps<DocsMobileSheetProps>();

  const barClass =
    'z-20 flex h-12 shrink-0 items-stretch border-t border-border bg-background shadow-sm lg:hidden';
  const barStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };
</script>

<template>
  <div :class="barClass" :style="barStyle">
    <DocsMobileSheetNav />
    <DocsSourceCode mobile />
    <DocsMobileSheetDetails :title="title">
      <slot></slot>
    </DocsMobileSheetDetails>
  </div>
</template>
