<script setup lang="ts">
  import { ref } from 'vue';
  import BlockPalette from '@registry/new-york/block-palette/BlockPalette.vue';
  import type {
    BlockPaletteDragEnd,
    BlockPaletteItem,
  } from '@registry/new-york/block-palette/types';

  const blocks = ref<BlockPaletteItem[]>([
    { id: 'group', kind: 'group', title: 'Group', subtitle: 'frame blocks' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Chart',
      subtitle: 'bar · line · area',
    },
    { id: 'slice', kind: 'slice', title: 'Slice', subtitle: 'query a cube' },
    {
      id: 'parameter',
      kind: 'parameter',
      title: 'Parameter',
      subtitle: 'date, shift, cell',
    },
    {
      id: 'markdown',
      kind: 'markdown',
      title: 'Markdown',
      subtitle: 'notes & headings',
    },
  ]);

  const status = ref('Drag a row to reorder, or press Enter to add it.');

  function onPick(block: BlockPaletteItem): void {
    status.value = `Added ${block.title} to the canvas`;
  }

  function onAdd(): void {
    status.value = 'Opened the block library';
  }

  function onDragEnd(payload: BlockPaletteDragEnd): void {
    status.value = payload.inside
      ? `Moved ${payload.block.title}`
      : `Dropped ${payload.block.title} on the canvas`;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import BlockPalette from '~/components/ui/block-palette/BlockPalette.vue';
  import type { BlockPaletteItem } from '~/components/ui/block-palette/types';

  const blocks = ref<BlockPaletteItem[]>([
    { id: 'group', kind: 'group', title: 'Group', subtitle: 'frame blocks' },
    { id: 'chart', kind: 'chart', title: 'Chart', subtitle: 'bar · line · area' },
    { id: 'slice', kind: 'slice', title: 'Slice', subtitle: 'query a cube' },
    { id: 'parameter', kind: 'parameter', title: 'Parameter', subtitle: 'date, shift, cell' },
    { id: 'markdown', kind: 'markdown', title: 'Markdown', subtitle: 'notes & headings' },
  ]);

  function addToCanvas(block: BlockPaletteItem) {
    console.log('add', block.id);
  }
</script>

<template>
  <BlockPalette v-model=&quot;blocks&quot; @pick=&quot;addToCanvas&quot; />
</template>`"
  >
    <div
      class="flex size-full min-h-100 flex-col items-center justify-center gap-4 p-6"
    >
      <BlockPalette
        v-model="blocks"
        @pick="onPick"
        @add="onAdd"
        @drag-end="onDragEnd"
      />
      <p class="text-xs text-muted-foreground" aria-live="polite">
        {{ status }}
      </p>
    </div>
  </ComponentDemo>
</template>
