<script setup lang="ts">
  import { ref } from 'vue';
  import DragReorderList from '@registry/new-york/drag-reorder-list/DragReorderList.vue';

  const tracks = ref([
    'Midnight City — M83',
    'Nightcall — Kavinsky',
    'Genesis — Justice',
    'Instant Crush — Daft Punk',
    'The Line — Odesza',
  ]);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import DragReorderList from '~/components/ui/drag-reorder-list/DragReorderList.vue';

  const tracks = ref([
    'Midnight City — M83',
    'Nightcall — Kavinsky',
    'Genesis — Justice',
    'Instant Crush — Daft Punk',
    'The Line — Odesza',
  ]);
</script>

<template>
  <DragReorderList v-model=&quot;tracks&quot; :item-height=&quot;56&quot; :gap=&quot;8&quot; />
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center rounded-lg p-6">
      <div class="w-full max-w-sm">
        <DragReorderList v-model="tracks" :item-height="56" :gap="8" />
      </div>
    </div>
  </ComponentDemo>
</template>
