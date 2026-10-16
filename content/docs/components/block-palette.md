---
title: Block Palette
description: An "Add Block" panel with search, colored block types, live previews and pointer or keyboard drag-to-reorder that lifts the row as a tilted card.
---

# Block Palette

A compact block library for canvas and notebook editors. Each row shows a colored icon tile, a title, a short hint and a tiny preview of the block. Drag a row and it lifts as a tilted card with a blue outline while a blue line marks where it will land. Drop it on the list to reorder, or drop it anywhere else and handle `drag-end` to place it on your canvas. Press `/` to search.

::demo-block-palette
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/block-palette.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import BlockPalette from '~/components/ui/block-palette/BlockPalette.vue';
  import type {
    BlockPaletteDragEnd,
    BlockPaletteItem,
  } from '~/components/ui/block-palette/types';

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

  function addToCanvas(block: BlockPaletteItem) {
    console.log('add', block.id);
  }

  function onDragEnd({ block, inside, x, y }: BlockPaletteDragEnd) {
    if (!inside) console.log('drop', block.id, 'at', x, y);
  }
</script>

<template>
  <BlockPalette v-model="blocks" @pick="addToCanvas" @drag-end="onDragEnd" />
</template>
```

`v-model` holds the block order. A drop on the list writes the new order back. A drop outside the list keeps the order and reports the pointer position in `drag-end`.

## Props

| Prop                 | Type                 | Default                  | Description                                     |
| -------------------- | -------------------- | ------------------------ | ----------------------------------------------- |
| `model-value`        | `BlockPaletteItem[]` | —                        | `v-model`. The blocks, in order.                |
| `title`              | `string`             | `'Add Block'`            | Panel heading.                                  |
| `description`        | `string`             | `'drag onto the canvas'` | Muted line under the heading.                   |
| `search-placeholder` | `string`             | `'Search blocks'`        | Placeholder for the search field.               |
| `shortcut`           | `string`             | `'/'`                    | Key that focuses the search. `''` turns it off. |
| `empty-text`         | `string`             | `'No blocks match.'`     | Shown when the search matches nothing.          |
| `add-label`          | `string`             | `'Add block'`            | Accessible label for the `+` button.            |
| `class`              | `string`             | `''`                     | Extra classes for the root element.             |

## Block options

| Option     | Type                                                         | Description                                          |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `id`       | `string`                                                     | Unique id.                                           |
| `kind`     | `'group' \| 'chart' \| 'slice' \| 'parameter' \| 'markdown'` | Picks the icon color and the preview.                |
| `title`    | `string`                                                     | Row title. The search matches it.                    |
| `subtitle` | `string`                                                     | Muted hint. The search matches it too.               |
| `icon`     | `string`                                                     | Replaces the icon for the kind, e.g. `lucide:table`. |

## Events

| Event        | Payload                   | Description                                                                |
| ------------ | ------------------------- | -------------------------------------------------------------------------- |
| `pick`       | `block`                   | A row was clicked, or Enter was pressed on it.                             |
| `drag-start` | `block, PointerEvent`     | The pointer moved far enough to lift a row.                                |
| `drag-end`   | `{ block, inside, x, y }` | The row was dropped. `inside` is `false` when it was dropped off the list. |
| `add`        | —                         | The `+` button was pressed.                                                |

## Accessibility

- Rows are focusable. Up and Down move focus between rows.
- Space picks up the focused row, the arrow keys move it and Space drops it. Escape puts it back. Every step is announced through `aria-live`.
- Escape also cancels a pointer drag.
- `/` focuses the search unless you are typing in a field.
- With reduced motion the lifted card does not tilt or spring.
