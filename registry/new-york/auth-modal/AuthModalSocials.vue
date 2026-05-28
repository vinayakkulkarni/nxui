<script setup lang="ts">
  import type { SocialProvider } from './types';

  defineProps<{
    providers: SocialProvider[];
  }>();

  const emit = defineEmits<{
    login: [provider: string];
  }>();
</script>

<template>
  <div class="grid grid-cols-5 gap-3">
    <button
      v-for="(btn, i) in providers"
      :key="i"
      class="flex aspect-square items-center justify-center rounded-2xl border border-zinc-200 bg-white transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
      :aria-label="`Sign in with ${btn.label}`"
      @click="emit('login', btn.label)"
    >
      <Icon :name="btn.icon" class="size-5" />
    </button>
  </div>
</template>
