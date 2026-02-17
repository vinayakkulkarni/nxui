<script setup lang="ts">
  defineProps<{
    title: string;
    path: string;
    isActive: boolean;
  }>();
</script>

<template>
  <NuxtLink
    :to="path"
    :class="[
      'group relative flex items-center rounded-lg px-3 py-1.5 text-[13px] transition-all duration-150',
      isActive
        ? 'bg-accent font-medium text-foreground dark:bg-white/[0.08]'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-white/[0.04]',
    ]"
  >
    <div
      v-if="isActive"
      class="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
    ></div>
    <span>{{ title }}</span>
  </NuxtLink>
</template>
