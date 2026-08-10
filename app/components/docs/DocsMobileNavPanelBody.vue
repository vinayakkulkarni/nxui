<script setup lang="ts">
  import { docsNav } from '~/config/docs';

  const emit = defineEmits<{
    close: [];
  }>();

  const { activeHrefByGroup } = useDocsActiveNav();
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6">
    <nav class="space-y-8">
      <DocsMobileNavGroup
        v-for="group in docsNav"
        :key="group.title"
        :title="group.title"
        :items="group.items"
        :active-href="activeHrefByGroup[group.title] ?? null"
        @close="emit('close')"
      />
      <div class="pt-4 border-t border-border">
        <NuxtLink
          to="https://github.com/vinayakkulkarni/nxui"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          GitHub
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
