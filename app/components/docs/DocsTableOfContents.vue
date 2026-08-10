<script setup lang="ts">
  const { headings, activeId, handleClick } = useTocScroll();
</script>

<template>
  <aside
    class="hidden w-64 shrink-0 border-l border-border/30 xl:block dark:border-white/6"
  >
    <div
      class="sticky top-16 flex h-[calc(100svh-4rem)] flex-col overflow-y-auto py-10 pl-6 pr-4"
    >
      <DocsTocList
        v-if="headings.length > 0"
        :headings="headings"
        :active-id="activeId"
        @select="handleClick"
      />
      <div class="mt-auto pt-6">
        <DocsTocPromo />
      </div>
    </div>
  </aside>
</template>
