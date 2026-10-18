---
title: Dot Field
description: A gradient dot field seen through a lens that follows the cursor, magnifying, pinching or swirling the dots.
---

Dot Field lays out thousands of gradient dots and puts a smooth lens under the cursor that magnifies, pinches or swirls them, with a soft glow in the middle. Press and hold to zoom closer. The field pulls into focus on mount, and can drift in a slow wave or sparkle like stars.

::demo-dot-field
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dot-field.json"
```

## Usage

```vue
<script setup lang="ts">
  import DotField from '~/components/ui/dot-field/DotField.vue';
</script>

<template>
  <div class="relative size-full min-h-80 overflow-hidden">
    <DotField
      class="absolute inset-0 size-full"
      pattern="grid"
      gradient-from="#5227FF"
      gradient-to="#FF9FFC"
      :cursor-radius="240"
      :bulge-strength="0.6"
      :twist="0"
    />
  </div>
</template>
```

The demo presets (Lens, Vortex, Gravity, Sunflower, Honeycomb, Drift, Starfield) ship with the component. `dotFieldPreset('vortex')` returns the full set of visual props; pass `true` as the second argument for the light-page variant.

```vue
<script setup lang="ts">
  import { DotField, dotFieldPreset } from '~/components/ui/dot-field';

  const vortex = dotFieldPreset('vortex');
</script>

<template>
  <DotField v-bind="vortex" />
</template>
```

## Props

| Prop                     | Type                                       | Default     | Description                                                                                           |
| ------------------------ | ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| `dot-radius`             | `number`                                   | `1.5`       | Radius of each dot in pixels.                                                                         |
| `dot-spacing`            | `number`                                   | `14`        | Gap between neighbouring dots in pixels.                                                              |
| `pattern`                | `'grid' \| 'hex' \| 'spiral' \| 'scatter'` | `'grid'`    | How the dots are laid out: square rows, offset honeycomb rows, a sunflower spiral or a loose scatter. |
| `gradient-from`          | `string`                                   | `'#5227FF'` | Color the gradient starts from.                                                                       |
| `gradient-to`            | `string`                                   | `'#FF9FFC'` | Color the gradient ends on.                                                                           |
| `gradient-angle`         | `number`                                   | `135`       | Direction of the gradient in degrees, the same as CSS `linear-gradient`.                              |
| `cursor-radius`          | `number`                                   | `240`       | Radius of the lens that follows the cursor, in pixels.                                                |
| `bulge-strength`         | `number`                                   | `0.6`       | How much the lens magnifies the dots under it, from -1 to 1. Negative values pinch them inward.       |
| `twist`                  | `number`                                   | `0`         | Swirls the dots around the cursor by this many degrees. Negative values swirl the other way.          |
| `glow-color`             | `string`                                   | `'#ffffff'` | Color the dots inside the glow light up to.                                                           |
| `glow-radius`            | `number`                                   | `160`       | Radius of the glow around the cursor, in pixels. 0 turns it off.                                      |
| `glow-intensity`         | `number`                                   | `0.8`       | How strongly the dots inside the glow light up and bloom.                                             |
| `base-opacity`           | `number`                                   | `0.55`      | Opacity of the dots outside the glow, from 0 to 1.                                                    |
| `wave-amplitude`         | `number`                                   | `0`         | How far the dots drift in a slow rolling wave, in pixels. 0 keeps the field still.                    |
| `sparkle`                | `boolean`                                  | `false`     | A few dots at a time softly grow and brighten, like stars twinkling.                                  |
| `speed`                  | `number`                                   | `1`         | How fast the wave and the sparkles animate.                                                           |
| `interactive`            | `boolean`                                  | `true`      | The lens follows the cursor or finger. Turn off for a purely ambient background.                      |
| `hold-to-zoom`           | `boolean`                                  | `true`      | Pressing and holding deepens the lens to look closer.                                                 |
| `intro`                  | `boolean`                                  | `true`      | The field pulls into focus on mount.                                                                  |
| `light-mode`             | `boolean`                                  | `false`     | Prints the dots as ink so they stay crisp on light backgrounds.                                       |
| `opacity`                | `number`                                   | `1`         | Overall opacity, from 0 to 1.                                                                         |
| `max-device-pixel-ratio` | `number`                                   | `2`         | Highest pixel ratio the canvas renders at.                                                            |
| `class`                  | `string`                                   | `''`        | Extra classes for the container.                                                                      |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`; put real content on top of it.
- With `prefers-reduced-motion: reduce`, the intro is skipped and the wave and sparkles hold still. The lens still follows the pointer.
- The render loop only runs while something moves, and stops when the field is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/dot-field) by David Haz.
