<script setup lang="ts">
import type { PropItem } from '~/types/docs';

defineProps<{
  props: PropItem[];
}>();
</script>

<template>
  <div class="my-6 w-full overflow-y-auto rounded-lg border">
    <table class="w-full text-left text-sm">
      <thead class="bg-muted/50">
        <tr
          class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        >
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]"
          >
            Prop
          </th>
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]"
          >
            Type
          </th>
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]"
          >
            Default
          </th>
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
          >
            Description
          </th>
        </tr>
      </thead>
      <tbody class="[&_tr:last-child]:border-0">
        <tr
          v-for="prop in props"
          :key="prop.name"
          class="border-b transition-colors data-[state=selected]:bg-muted"
        >
          <td
            class="p-4 align-middle font-mono font-semibold text-foreground"
          >
            {{ prop.name }}
          </td>
          <td class="p-4 align-middle font-mono text-muted-foreground">
            {{ prop.type }}
          </td>
          <td class="p-4 align-middle font-mono text-muted-foreground">
            {{ prop.default ?? '-' }}
          </td>
          <td class="p-4 align-middle text-muted-foreground">
            {{ prop.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
