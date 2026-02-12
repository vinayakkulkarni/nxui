<script setup lang="ts">
  import type { PropDefinition } from '~/types/docs';

  defineProps<{
    props: PropDefinition[];
  }>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b">
          <th class="px-4 py-2 text-left font-medium">Prop</th>
          <th class="px-4 py-2 text-left font-medium">Type</th>
          <th class="px-4 py-2 text-left font-medium">Default</th>
          <th class="px-4 py-2 text-left font-medium">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="prop in props"
          :key="prop.name"
          class="border-b"
        >
          <td class="px-4 py-2 font-mono text-xs">{{ prop.name }}</td>
          <td class="px-4 py-2 font-mono text-xs text-muted-foreground">
            {{ prop.type }}
          </td>
          <td class="px-4 py-2 font-mono text-xs text-muted-foreground">
            {{ prop.default ?? '-' }}
          </td>
          <td class="px-4 py-2 text-muted-foreground">
            {{ prop.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
