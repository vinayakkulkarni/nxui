---
title: Variable Proximity
description: Letters change variable-font weight as the cursor gets close, and can shift color, grow and rise; an idle wave of weight runs while the cursor is away.
---

Text set in a variable font where each letter gets heavier the closer the cursor is. Move the pointer over the text to drag a bold wake through it. Letters can also blend toward an accent color, grow and rise under the cursor, and with the idle wave on, a slow ripple of weight runs across the text while the cursor is away. Lines are frozen after layout, so the text never rewraps while weights change.

::demo-variable-proximity
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/variable-proximity.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import VariableProximity from '~/components/ui/variable-proximity/VariableProximity.vue';

  const containerRef = ref<HTMLElement | null>(null);
</script>

<template>
  <div ref="containerRef" class="relative">
    <VariableProximity
      label="Hover me! And then star nxui on GitHub, or else..."
      from-font-variation-settings="'wght' 300, 'opsz' 9"
      to-font-variation-settings="'wght' 800, 'opsz' 40"
      :container-ref="containerRef"
      :radius="150"
      falloff="gaussian"
      to-color="#ff5a36"
      :scale="1.22"
      :lift="0.16"
      :font-size="64"
    />
  </div>
</template>
```

The component loads [Roboto Flex](https://fonts.google.com/specimen/Roboto+Flex) from Google Fonts on mount and sets it on the root. Any variable font works: override the family with a `font-*` class and use axes that font supports.

## Props

| Prop                           | Type                                      | Default                    | Description                                                                                                     |
| ------------------------------ | ----------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `label`                        | `string`                                  | —                          | The text to display                                                                                             |
| `from-font-variation-settings` | `string`                                  | `"'wght' 400, 'opsz' 9"`   | Variation settings letters rest at, away from the cursor                                                        |
| `to-font-variation-settings`   | `string`                                  | `"'wght' 1000, 'opsz' 40"` | Variation settings reached right under the cursor                                                               |
| `container-ref`                | `HTMLElement \| null`                     | `null`                     | Optional element around the text. Distance checks are skipped while the cursor is farther than `radius` from it |
| `radius`                       | `number`                                  | `50`                       | Reach of the effect (px)                                                                                        |
| `falloff`                      | `'linear' \| 'exponential' \| 'gaussian'` | `'linear'`                 | How the effect fades with distance                                                                              |
| `smoothing`                    | `number`                                  | `0.2`                      | How gently letters ease to new settings, from 0 (instant) to 1 (slow trailing wake)                             |
| `from-color`                   | `string`                                  | —                          | Color letters rest at. Unset keeps the text color                                                               |
| `to-color`                     | `string`                                  | —                          | Color letters blend toward near the cursor. Unset keeps the text color                                          |
| `scale`                        | `number`                                  | `1`                        | Size a letter grows to under the cursor. 1 keeps the normal size                                                |
| `lift`                         | `number`                                  | `0`                        | How far (em) a letter under the cursor rises                                                                    |
| `idle-wave`                    | `boolean`                                 | `false`                    | A gentle wave of weight travels across the text while the cursor is away                                        |
| `font-size`                    | `number \| string`                        | —                          | Font size. Numbers are px. Inherits the surrounding size when unset                                             |
| `class`                        | `string`                                  | `''`                       | Extra classes on the root                                                                                       |

Other attributes (`style`, `@click`, …) pass through to the root `<span>`.

## Accessibility

- Each letter is `aria-hidden`; the full label is repeated in a visually hidden span so screen readers read it once as plain text.
- With `prefers-reduced-motion: reduce` the idle wave stays off. Proximity changes still follow the pointer, because they are direct feedback to it.
- The loop only runs while letters are settling or the idle wave is on, and the wave pauses while the text is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/variable-proximity) by David Haz.
