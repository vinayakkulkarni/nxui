---
title: Folder
description: Folder that drops its flap open or swings open like a book, in solid, glass or matte, with pages you can pick, drag out and drop back in.
---

A spring-driven 3D folder. Click it (or hover, with `open-on="hover"`) to open it: in `flap` mode the front flap drops forward and the pages fan out above; in `book` mode it lies flat and the cover swings over like a book. Hover to tease the pages out, click a page to bring it up close, and drag pages out onto the desk and back in again. The `glass` material renders the front as refracting, frosted WebGL glass.

::demo-folder
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/folder.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import Folder from '~/components/ui/folder/Folder.vue';
  import type { FolderEntry } from '~/components/ui/folder/types';

  const open = ref(false);
  const items: FolderEntry[] = [
    { title: 'Brand guidelines', description: 'Logo, color and type rules.' },
    'Launch plan',
    { title: 'Moodboard', image: '/moodboard.jpg', alt: 'Moodboard' },
  ];

  function onDrop(item: FolderEntry, index: number, inside: boolean) {
    console.log(index, inside ? 'put back' : 'left on the desk');
  }
</script>

<template>
  <Folder
    v-model:open="open"
    :items="items"
    label="Projects"
    mode="book"
    variant="glass"
    color="#7aa7ff"
    layout="spread"
    @item-drop="onDrop"
  />
</template>
```

Use the `item` slot to render your own page content. It receives `{ item, index }`:

```vue
<Folder :items="tickets">
  <template #item="{ item }">
    <TicketCard :ticket="item" />
  </template>
</Folder>
```

## Props

| Prop                     | Type                            | Default                | Description                                                                                              |
| ------------------------ | ------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `items`                  | `FolderEntry[]`                 | Three sample documents | What the folder holds, up to 6. A string, a number, `{ title, description }` or `{ image, title, alt }`. |
| `mode`                   | `'flap' \| 'book'`              | `'flap'`               | `flap` stands the folder up and drops the front open. `book` lays it flat and swings the cover over.     |
| `variant`                | `'solid' \| 'glass' \| 'matte'` | `'solid'`              | Material. `glass` turns the front into refracting glass that shows the pages inside.                     |
| `layout`                 | `'spread' \| 'stack' \| 'row'`  | `'spread'`             | How the pages are laid out once the folder is open.                                                      |
| `color`                  | `string`                        | `'#3d8bff'`            | Folder color. Shades are derived from it.                                                                |
| `paper-color`            | `string`                        | `'#ffffff'`            | Page color.                                                                                              |
| `label`                  | `string`                        | `undefined`            | Text on the tab. The tab grows to fit it.                                                                |
| `tab-position`           | `'left' \| 'center' \| 'right'` | `'right'`              | Where the tab sits along the top edge.                                                                   |
| `open-on`                | `'click' \| 'hover'`            | `'click'`              | Open on click, or while the cursor is over the folder.                                                   |
| `open`                   | `boolean`                       | `undefined`            | Controls the folder (`v-model:open`). Leave it out to let the folder manage itself.                      |
| `default-open`           | `boolean`                       | `false`                | Starts the folder open.                                                                                  |
| `draggable`              | `boolean`                       | `true`                 | Drag pages out, leave them anywhere and drop them back in.                                               |
| `zoom-on-click`          | `boolean`                       | `true`                 | Clicking a page brings it up close. Click it again, press Escape or click away to put it back.           |
| `peek`                   | `boolean`                       | `true`                 | Teases the pages out on hover. In flap mode the page under the cursor rises highest.                     |
| `intro`                  | `boolean`                       | `true`                 | Entrance when the folder scrolls into view: the pages drop in and the folder closes over them.           |
| `size`                   | `number`                        | `1`                    | Scale of the whole folder.                                                                               |
| `frost`                  | `number`                        | `0.25`                 | How much the glass front blurs what is behind it, 0 (clear) to 1. Glass variant only.                    |
| `tilt`                   | `number`                        | `0.5`                  | How much the folder tilts toward the cursor, 0 to 1.5.                                                   |
| `speed`                  | `number`                        | `1`                    | Speed of every animation.                                                                                |
| `bounce`                 | `number`                        | `0.4`                  | How much the flap, cover and pages overshoot as they settle, 0 to 1.                                     |
| `close-on-outside-click` | `boolean`                       | `true`                 | Closes the folder on a click outside it or on Escape.                                                    |
| `theme`                  | `'dark' \| 'light'`             | `'dark'`               | Tunes the shadows and glass sheen for dark or light pages.                                               |
| `class`                  | `string`                        | `''`                   | Extra classes for the root.                                                                              |

`FolderItem` also accepts `crossOrigin: 'anonymous'` for remote images, so the glass front can refract them (the host must send CORS headers).

## Events

| Event         | Payload                                               | Description                                                                    |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `update:open` | `(open: boolean)`                                     | The folder opened or closed.                                                   |
| `item-click`  | `(item: FolderEntry, index: number)`                  | A page was clicked while the folder is open, or after it was dragged out.      |
| `item-drop`   | `(item: FolderEntry, index: number, inside: boolean)` | A dragged page was let go; `inside` says whether it landed back in the folder. |

## Slots

| Slot   | Props                                  | Description                   |
| ------ | -------------------------------------- | ----------------------------- |
| `item` | `{ item: FolderEntry, index: number }` | Custom content for each page. |

## Accessibility

- The folder is a `role="button"` with `aria-expanded`; Enter or Space toggles it and a focus ring traces the folder outline.
- Pages become buttons (focusable, Enter or Space to zoom) while the folder is open or after they are dragged out.
- Escape puts a zoomed page back, then closes the folder.
- With `prefers-reduced-motion: reduce` the springs are critically damped, the tilt and entrance are skipped and pages no longer stagger.

- Ported from [React Bits](https://reactbits.dev/components/folder) by David Haz.
