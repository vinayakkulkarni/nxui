---
title: Pattern Donut
description: A two-ring donut. The inner ring shows categories as solid slices; the outer ring splits each one into its causes with line, dot and checker textures.
---

# Pattern Donut

A breakdown card for "where did the time go" questions. The inner ring shows each category as a solid slice. The outer ring splits every category into its causes, and the texture tells the rank: lines for the top cause, dots for the second, checker for the third. The center shows the active category and its share. Hover or focus a slice or a legend item to highlight it, and click to pin it. The pill at the bottom counts the fewest categories that reach 75 % of the total. The rings sweep in clockwise on load.

::demo-pattern-donut
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pattern-donut.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PatternDonut from '~/components/ui/pattern-donut/PatternDonut.vue';
  import type { PatternDonutCategory } from '~/components/ui/pattern-donut/types';

  const stops: PatternDonutCategory[] = [
    {
      label: 'Tooling',
      value: 412,
      color: '#f5d03b',
      causes: [
        { label: 'Tool change', value: 220 },
        { label: 'Tool breakage', value: 118 },
        { label: 'Fixture swap', value: 74 },
      ],
    },
    { label: 'Maint', value: 318, color: '#a46cf5' },
    { label: 'Material', value: 221, color: '#3ee0d8' },
    { label: 'Setup', value: 168, color: '#f590b4' },
    { label: 'Quality', value: 77, color: '#f2742b' },
    { label: 'Other', value: 40, color: '#8a8a8a' },
  ];

  const selected = ref<string | null>(null);
</script>

<template>
  <PatternDonut
    v-model:selected="selected"
    :data="stops"
    title="Why Lines Stop"
    description="minutes · last 28 days"
    unit="min"
    :delta="-14"
    delta-label="vs Aug"
  />
</template>
```

Causes are sorted by value inside each category. A category without `causes` fills its outer segment with the first texture.

## Props

| Prop                | Type                        | Default                                                         | Description                                                        |
| ------------------- | --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `data`              | `PatternDonutCategory[]`    | —                                                               | Categories, drawn clockwise from 12 o'clock.                       |
| `selected`          | `string \| null`            | `null`                                                          | `v-model`. Label of the pinned category.                           |
| `title`             | `string`                    | `''`                                                            | Card title.                                                        |
| `description`       | `string`                    | `''`                                                            | Line under the title.                                              |
| `unit`              | `string`                    | `''`                                                            | Unit after the total, e.g. `min`.                                  |
| `delta`             | `number`                    | —                                                               | Change against the last period, in percent. Hidden when not set.   |
| `delta-label`       | `string`                    | `''`                                                            | Text after the delta, e.g. `vs Aug`.                               |
| `lower-is-better`   | `boolean`                   | `true`                                                          | A falling delta shows green. Set `false` when a rise is good news. |
| `pattern-labels`    | `string[]`                  | `['top cause', '2nd', '3rd']`                                   | Labels for the pattern key, in rank order.                         |
| `patterns`          | `PatternDonutPatternKind[]` | `['lines', 'dots', 'checker', 'crosshatch', 'grid', 'stripes']` | Texture for each cause rank.                                       |
| `insight-threshold` | `number`                    | `0.75`                                                          | Share (0–1) that the insight pill counts the top categories up to. |
| `insight-suffix`    | `string`                    | `'of lost minutes'`                                             | Words after the share in the insight pill.                         |
| `hide-insight`      | `boolean`                   | `false`                                                         | Hides the insight pill.                                            |
| `locale`            | `string`                    | `'en-US'`                                                       | Locale for number formatting.                                      |
| `class`             | `string`                    | `''`                                                            | Extra classes for the root element.                                |

## Category options

| Option   | Type                 | Description                                          |
| -------- | -------------------- | ---------------------------------------------------- |
| `label`  | `string`             | Category name. Also the value of `v-model:selected`. |
| `value`  | `number`             | Category total.                                      |
| `color`  | `string`             | Any CSS color for the slice, textures and legend.    |
| `causes` | `{ label, value }[]` | Breakdown shown in the outer ring.                   |

## Slots

| Slot      | Props              | Description                                                   |
| --------- | ------------------ | ------------------------------------------------------------- |
| `insight` | `{ count, share }` | Replaces the insight text. `share` is a fraction from 0 to 1. |

## Accessibility

- Each inner slice is a button with a label such as "Tooling: 412 min, 33%". Only one slice is in the tab order; arrow keys, Home and End move between slices.
- Legend items are buttons with the same arrow-key movement. Both set `aria-pressed` when pinned.
- Enter or Space pins a slice; Escape clears the pin.
- The center label is announced through `aria-live`. Outer segments have a `<title>` with the cause and its value.
- The sweep-in animation and the dimming transition are off when the user prefers reduced motion.
