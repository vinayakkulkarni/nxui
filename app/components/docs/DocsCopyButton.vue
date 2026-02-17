<script setup lang="ts">
  const props = defineProps<{
    code: string;
  }>();

  const { copy, copied } = useClipboard({ source: () => props.code });
</script>

<template>
  <button
    :class="[
      'absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 z-10',
      copied
        ? 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-950 dark:text-zinc-50'
        : 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80',
    ]"
    :aria-label="copied ? 'Copied' : 'Copy code'"
    @click="copy(code)"
  >
    <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
  </button>
</template>
