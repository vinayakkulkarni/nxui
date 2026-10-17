---
title: Branched Menu
description: Collapsible menu that branches each section from a trunk and traces a line to your pick.
---

A sidebar menu where each section folds open into a tree. Its children hang off a trunk on curved branches. Pick a child and an accent line draws from the top of the trunk down its branch to the pick, while a marker on the rail slides to that section's header. Click a header to fold or unfold it.

::demo-branched-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/branched-menu.json"
```

## Usage

```vue
<script setup lang="ts">
  import BranchedMenu from '~/components/ui/branched-menu/BranchedMenu.vue';
  import type { BranchedMenuItem } from '~/components/ui/branched-menu';

  const items: BranchedMenuItem[] = [
    {
      label: 'Getting started',
      children: [
        { value: 'install', label: 'Installation', icon: 'lucide:download' },
        { value: 'quick', label: 'Quick start', icon: 'lucide:rocket' },
      ],
    },
    { label: 'Changelog', value: 'changelog' },
  ];

  function onSelect(value: string) {
    console.log(value);
  }
</script>

<template>
  <BranchedMenu
    :items="items"
    :default-open="0"
    default-active="quick"
    @select="onSelect"
  />
</template>
```

Each branch is one SVG path from the trunk, around an arc of `radius`, to just before `indent`. The accent path for a child runs from the top of the trunk to that child; its dash offset animates from its full length to 0 when it is picked, so the line appears to travel. Sections fold with a `grid-template-rows` transition from `0fr` to `1fr`.

## Props

| Prop             | Type                      | Default                                                           | Description                                                                                                                        |
| ---------------- | ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `items`          | `BranchedMenuItem[]`      | two sample sections                                               | Sections: a label plus children (`value`, `label`, `icon`), or a leaf with a value. A section with children folds; a leaf selects. |
| `default-open`   | `number \| number[]`      | `0`                                                               | The section, or sections, open at first. -1 for none.                                                                              |
| `default-active` | `string`                  | `''`                                                              | Value selected at first. Empty picks the open section's first child.                                                               |
| `color`          | `string`                  | `'var(--foreground)'`                                             | The ink. Idle text is a mix of it.                                                                                                 |
| `accent-color`   | `string`                  | `'var(--foreground)'`                                             | The active line, the active label and the marker.                                                                                  |
| `line-color`     | `string`                  | `'color-mix(in oklab, var(--foreground) 24%, var(--background))'` | The rail, trunk and branches. A solid colour, so joints never darken.                                                              |
| `width`          | `number`                  | `240`                                                             | The widest the menu may be, in px. It shrinks to its content.                                                                      |
| `row-height`     | `number`                  | `36`                                                              | Height of a child row in px.                                                                                                       |
| `indent`         | `number`                  | `40`                                                              | Where child rows start, in px. Branches end just before it.                                                                        |
| `trunk`          | `number`                  | `14`                                                              | The trunk line's x position, in px.                                                                                                |
| `radius`         | `number`                  | `10`                                                              | The curve of each branch, in px.                                                                                                   |
| `line-width`     | `number`                  | `1.5`                                                             | Stroke width of the lines.                                                                                                         |
| `font-size`      | `number`                  | `14`                                                              | Child text size in px. Headers are 1px larger.                                                                                     |
| `draw-duration`  | `number`                  | `400`                                                             | The accent line's travel, in ms.                                                                                                   |
| `fold-duration`  | `number`                  | `300`                                                             | A section's fold and unfold, in ms.                                                                                                |
| `class`          | `HTMLAttributes['class']` | —                                                                 | Extra classes for the nav.                                                                                                         |

## Events

| Event    | Payload                                                        | Description                   |
| -------- | -------------------------------------------------------------- | ----------------------------- |
| `select` | `(value: string, item: BranchedMenuItem \| BranchedMenuChild)` | A child or a leaf was picked. |
| `toggle` | `(index: number, open: boolean)`                               | A section folded or unfolded. |

## Accessibility

- Rendered as a `<nav>` of real buttons. Section headers carry `aria-expanded`; the picked child or leaf carries `aria-current="true"`.
- Children of a folded section are `inert` and leave the tab order.
- Keyboard focus draws a ring on headers and rows.
- With `prefers-reduced-motion: reduce` the fold, the line draw and the marker slide are instant.

- Ported from [React Bits](https://reactbits.dev/micro/branched-menu) by David Haz.
