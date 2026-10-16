---
title: Lattice Loader
description: Agent status row with a lattice of cells that brighten in a wave beside a live stopwatch.
---

# Lattice Loader

A status row for an agent that is thinking. A small 3 × 3 or 4 × 4 lattice of cells brightens in a wave while a stopwatch counts tenths of a second beside the label. When `status` turns to `done` the wave fades into a green tick and the label reads "Done in" with the final time; on `error` it shows a red cross and "Failed after". Pick one of ten wave patterns or pass your own. Use the panel in the demo to switch status, grid and pattern.

::demo-lattice-loader
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lattice-loader.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import LatticeLoader from '~/components/ui/lattice-loader/LatticeLoader.vue';
  import type { LatticeStatus } from '~/components/ui/lattice-loader/types';

  const status = ref<LatticeStatus>('working');
</script>

<template>
  <LatticeLoader :status="status" pattern="orbit" :grid="3" label="Thinking" />
</template>
```

A custom pattern gives each cell (row-major) the wave step it lights on; `null` leaves a hole:

```vue
<LatticeLoader
  :grid="3"
  :pattern="{ cells: [0, 1, 2, 1, null, 3, 2, 3, 4], loop: 7, scale: 1 }"
/>
```

Named patterns: `arrow`, `dots`, `orbit`, `ripple`, `snake`, `spiral` on the 3 × 3 grid, and `sweep`, `spin`, `rain`, `pulse`, `orbit`, `snake` on the 4 × 4 grid. A name with no layout for the grid falls back to `orbit` (3 × 3) or `sweep` (4 × 4).

## Props

| Prop           | Type                                   | Default          | Description                                                                    |
| -------------- | -------------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `label`        | `string`                               | `'Thinking'`     | Text while working.                                                            |
| `done-label`   | `string`                               | `'Done in'`      | Text once done; the time follows it.                                           |
| `error-label`  | `string`                               | `'Failed after'` | Text on error; the time follows it.                                            |
| `status`       | `'working' \| 'done' \| 'error'`       | `'working'`      | Working runs the wave and the clock. Done and error stop both and show a mark. |
| `pattern`      | `LatticePatternName \| LatticePattern` | `'orbit'`        | A named wave or your own `{ cells, loop, scale, lit }`.                        |
| `grid`         | `3 \| 4`                               | `3`              | 3 × 3 or 4 × 4 cells.                                                          |
| `shape`        | `'square' \| 'round'`                  | `'round'`        | Square or round cells.                                                         |
| `color`        | `string`                               | `'currentColor'` | Ink for the cells.                                                             |
| `done-color`   | `string`                               | `'#22c55e'`      | The tick on done.                                                              |
| `error-color`  | `string`                               | `'#ef4444'`      | The cross on error.                                                            |
| `cell-size`    | `number`                               | `6`              | Cell size in px.                                                               |
| `gap`          | `number`                               | `2`              | Gap between cells in px.                                                       |
| `font-size`    | `number`                               | `14`             | Text size in px.                                                               |
| `step`         | `number`                               | `90`             | Milliseconds between wave steps.                                               |
| `idle-opacity` | `number`                               | `0.15`           | Opacity of an unlit cell.                                                      |
| `glow`         | `boolean`                              | `false`          | A soft halo around each cell.                                                  |
| `glow-color`   | `string`                               | `''`             | Halo colour. Empty uses the cell colour.                                       |
| `show-timer`   | `boolean`                              | `true`           | Shows the stopwatch.                                                           |
| `elapsed`      | `number`                               | —                | Seconds to show instead of the internal clock.                                 |
| `class`        | `string`                               | `''`             | Extra classes for the root.                                                    |

## Accessibility

- The root has `role="status"`. A visually hidden line announces "Thinking, in progress", then "Done in 2.4 seconds" or "Failed after 2.4 seconds".
- The lattice, label and timer are hidden from assistive tech so the clock does not chatter.
- With `prefers-reduced-motion`, all cells pulse together at a slower pace instead of running a wave, and the mark and label do not scale or blur.

- Ported from [React Bits](https://reactbits.dev/micro/lattice-loader) by David Haz.
