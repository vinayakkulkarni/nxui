---
title: Shredder
description: A list with a paper shredder at the bottom that cuts dragged rows into curling strips.
---

# Shredder

A list that sits on top of a paper shredder. Drag a row down into the slit and the rollers grab it, pull it through and cut it into strips that curl, flutter and fade as they fall. Drag a row up or down instead to reorder the list. A focused row shreds on Delete or Backspace. The strips are cut from a snapshot of the rendered row, so text, images and inline SVG all go through the shredder as they look.

::demo-shredder
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shredder.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import Shredder from '~/components/ui/shredder/Shredder.vue';

  const files = ref([
    { id: 1, title: 'Harbour at dusk', size: '4.1 MB' },
    { id: 2, title: 'Studio, take two', size: '2.8 MB' },
    { id: 3, title: 'Fog over the bay', size: '6.3 MB' },
  ]);

  function remove(file: { id: number }) {
    files.value = files.value.filter((row) => row.id !== file.id);
  }
</script>

<template>
  <Shredder :items="files" @shred="remove" @reorder="files = $event">
    <template #default="{ item }">
      <div class="flex items-center gap-3 rounded-xl bg-zinc-800 px-3.5 py-3">
        <span class="flex-1 truncate text-sm font-medium">{{
          item.title
        }}</span>
        <span class="text-xs opacity-45">{{ item.size }}</span>
      </div>
    </template>
  </Shredder>
</template>
```

Remove the item from your list in the `shred` handler, unless `loop`, `loop-after-delete` or `auto-animate` is on. With those on, keep the rows in your list so they can come back.

## Props

| Prop                | Type      | Default     | Description                                                                                                                   |
| ------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `items`             | `T[]`     | `[]`        | Rows to render, top to bottom. Each item needs a unique `id`.                                                                 |
| `width`             | `number`  | `340`       | Width of the whole machine in pixels.                                                                                         |
| `height`            | `number`  | `460`       | Total height. The rows stack up from the slit, which sits above the fall zone at the bottom.                                  |
| `inset`             | `number`  | `14`        | Horizontal inset of the rows from the edges. The slit is 6px wider than the rows on each side.                                |
| `gap`               | `number`  | `10`        | Space between rows in pixels.                                                                                                 |
| `slit-height`       | `number`  | `4`         | Thickness of the slit. It is always a full pill.                                                                              |
| `fall-height`       | `number`  | `140`       | Height of the zone under the slit where the strips fall and fade out.                                                         |
| `feed-speed`        | `number`  | `180`       | Roller speed in pixels per second. The first pull is faster and eases into it.                                                |
| `bite`              | `number`  | `18`        | How far a row has to be pushed into the slit before the rollers grab it, in pixels.                                           |
| `auto-feed`         | `boolean` | `true`      | Grab the row as soon as it is pushed in far enough, even while it is still held. Off, it feeds only on release over the slit. |
| `strip-width`       | `number`  | `10`        | Target width of each strip in pixels. The row is cut into equal columns.                                                      |
| `curl`              | `number`  | `1`         | How much the strips curl and wave as they come out. `0` keeps them straight.                                                  |
| `auto-animate`      | `boolean` | `false`     | Shreds the rows on its own, bottom to top, then brings them back and starts over. `shred` still fires.                        |
| `loop`              | `boolean` | `false`     | Once the last row has been shredded, bring them all back.                                                                     |
| `loop-after-delete` | `boolean` | `false`     | A shredded row comes back a moment later at a random spot, so the list never runs dry.                                        |
| `drag-tilt`         | `number`  | `6`         | Maximum lean in degrees while a row is dragged sideways.                                                                      |
| `lift`              | `number`  | `1.02`      | Scale of a row while it is held.                                                                                              |
| `slit-color`        | `string`  | `'#3f3f46'` | Colour of the slit.                                                                                                           |
| `color`             | `string`  | `'#f5f5f5'` | Text colour inherited by the rows.                                                                                            |
| `disabled`          | `boolean` | `false`     | Rows cannot be dragged or shredded.                                                                                           |
| `class`             | `string`  | `''`        | Extra classes for the root.                                                                                                   |

## Slots and events

| Name            | Payload           | Description                                                                           |
| --------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `default` slot  | `{ item, index }` | Renders one row. A snapshot of this markup is what gets cut into strips.              |
| `shred` event   | `item`            | Fires the moment a row has gone through the rollers.                                  |
| `reorder` event | `items`           | Fires with the items in their new order after a row is dropped elsewhere in the list. |

## Accessibility

- Each row is focusable. Delete or Backspace feeds the focused row into the shredder.
- Rows point to a screen-reader hint that explains drag-to-shred, drag-to-reorder and the Delete key.
- The slit and the falling strips are decorative and hidden from assistive tech.
- With `prefers-reduced-motion: reduce`, a shredded row is removed at once with no strips, and the list does not animate.
- Remote images in rows must allow CORS, or they show as a grey block in the strips.

- Ported from [React Bits](https://reactbits.dev/micro/shredder) by David Haz.
