<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const method = ref<'cli' | 'manual'>('cli');
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 border-b border-border/50">
      <button
        :class="
          cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200',
            method === 'cli'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )
        "
        @click="method = 'cli'"
      >
        CLI
      </button>
      <button
        :class="
          cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200',
            method === 'manual'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )
        "
        @click="method = 'manual'"
      >
        Manual
      </button>
    </div>

    <div class="min-h-25">
      <div v-show="method === 'cli'">
        <slot name="cli"></slot>
      </div>
      <div v-show="method === 'manual'">
        <slot name="manual"></slot>
      </div>
    </div>
  </div>
</template>
