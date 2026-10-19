<script setup lang="ts">
  import { useClipboard } from '@vueuse/core';

  defineProps<{ description?: string }>();

  const componentCount = useRuntimeConfig().public.componentCount;
  const command =
    'npx shadcn-vue@latest add "https://nxui.geoql.in/r/data-table.json"';
  const { copy, copied } = useClipboard({ source: command });
</script>

<template>
  <header class="space-y-6">
    <div class="space-y-4">
      <h1
        class="max-w-3xl font-display text-4xl font-bold md:text-5xl lg:text-6xl"
        style="letter-spacing: -0.04em; line-height: 1.05"
      >
        Animated Vue components you copy, paste and own.
      </h1>
      <p
        v-if="description"
        class="max-w-2xl font-serif text-lg/relaxed italic text-muted-foreground"
      >
        {{ description }}
        {{ componentCount }}+ components, MIT, free.
      </p>
    </div>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <a
        href="#gallery-heading"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Browse components
        <Icon name="lucide:arrow-down" class="size-4" />
      </a>
      <button
        type="button"
        class="inline-flex h-10 min-w-0 items-center gap-3 rounded-lg border border-border/60 bg-card px-4 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="copied ? 'Copied install command' : 'Copy install command'"
        @click="copy(command)"
      >
        <span class="truncate">{{ command }}</span>
        <Icon
          :name="copied ? 'lucide:check' : 'lucide:copy'"
          class="size-3.5 shrink-0"
        />
      </button>
    </div>
  </header>
</template>
