<script setup lang="ts">
  defineProps<{ query: string }>();

  const emit = defineEmits<{
    'update:query': [value: string];
    'update:input-ref': [el: HTMLInputElement | null];
  }>();

  const localInputRef = ref<HTMLInputElement | null>(null);

  onMounted(() => {
    emit('update:input-ref', localInputRef.value);
    nextTick(() => localInputRef.value?.focus());
  });
</script>

<template>
  <div class="flex items-center gap-3 border-b border-border/50 px-4 py-3">
    <div
      class="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5"
    >
      <Icon name="lucide:search" class="size-4 text-primary" />
    </div>
    <input
      ref="localInputRef"
      :value="query"
      type="search"
      aria-label="Search documentation"
      placeholder="Search documentation..."
      class="flex-1 bg-transparent text-base font-normal text-foreground outline-none placeholder:text-muted-foreground"
      @input="emit('update:query', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="query"
      type="button"
      class="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      @click="emit('update:query', '')"
    >
      Clear
    </button>
    <kbd
      class="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 px-2 font-mono text-[10px] font-medium text-muted-foreground"
    >
      ESC
    </kbd>
  </div>
</template>
