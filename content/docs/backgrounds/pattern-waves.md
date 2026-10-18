---
title: Pattern Waves
description: A lit halftone surface of dots, lines or glyphs that moves like draped silk.
---

A WebGL background that prints a moving, lit surface as a halftone of dots, squares, plus signs, contour lines or characters. Pick a preset or tune each value. Move the cursor to leave a wake of ripples, and click to drop a splash.

::demo-pattern-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pattern-waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import PatternWaves from '~/components/ui/pattern-waves/PatternWaves.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <PatternWaves
      preset="silk"
      color="#ffffff"
      background-color="#120f17"
      fade="edges"
      :fade-size="0.5"
      :cursor-size="50"
      :cursor-strength="0.6"
    />
  </div>
</template>
```

## Presets

| Preset     | Pattern | Wave     | Look                                  |
| ---------- | ------- | -------- | ------------------------------------- |
| `silk`     | `dot`   | `silk`   | Draped fabric folds in fine dots.     |
| `ocean`    | `dot`   | `swell`  | Rolling parallel waves.               |
| `pond`     | `dot`   | `ripple` | Rings that travel in from off screen. |
| `lines`    | `line`  | `silk`   | Flowing contour lines.                |
| `terminal` | `glyph` | `ripple` | Characters picked by brightness.      |
| `mesh`     | `plus`  | `silk`   | A grid of plus signs.                 |

## Props

| Prop               | Type                                                             | Default       | Description                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `preset`           | `'silk' \| 'ocean' \| 'pond' \| 'lines' \| 'terminal' \| 'mesh'` | `'silk'`      | A complete starting look. Every pattern, wave and light prop below overrides the preset value when you pass it.                               |
| `pattern`          | `'dot' \| 'square' \| 'plus' \| 'line' \| 'glyph'`               | from preset   | The mark that draws the surface. Line traces it as flowing contour lines, glyph uses characters picked by brightness.                         |
| `wave`             | `'silk' \| 'swell' \| 'ripple'`                                  | from preset   | The shape of the moving surface. Silk is draped fabric folds, swell is rolling parallel waves, ripple is rings travelling in from off screen. |
| `color`            | `string`                                                         | `'#ffffff'`   | The one color of the pattern. Shadows, midtones and highlights come from it. A color darker than the background prints like ink.              |
| `background-color` | `string`                                                         | `'#000000'`   | Color behind the pattern. Pass `transparent` to show the page through.                                                                        |
| `spacing`          | `number`                                                         | from preset   | Distance between marks in CSS pixels. Smaller values give a finer print.                                                                      |
| `mark-size`        | `number`                                                         | from preset   | Largest mark as a fraction of the spacing.                                                                                                    |
| `depth`            | `number`                                                         | from preset   | How tall the surface is. Deeper surfaces cast stronger shading and lift the marks along the crests.                                           |
| `light`            | `number`                                                         | from preset   | Angle of the light across the waves in degrees, from -90 to 90. 0 lights the folds head on, larger values graze them.                         |
| `shine`            | `number`                                                         | from preset   | Strength of the glints where the surface catches the light.                                                                                   |
| `contrast`         | `number`                                                         | from preset   | Spread between the quiet shadows and the lit areas.                                                                                           |
| `speed`            | `number`                                                         | from preset   | How fast the surface moves. 0 freezes it while the cursor keeps working.                                                                      |
| `scale`            | `number`                                                         | from preset   | Size of the waves. Larger values give broader, calmer forms.                                                                                  |
| `direction`        | `number`                                                         | from preset   | Direction the waves travel in degrees. The light turns with it.                                                                               |
| `opacity`          | `number`                                                         | `1`           | Overall opacity of the pattern, from 0 to 1.                                                                                                  |
| `fade`             | `'edges' \| 'center' \| 'bottom' \| 'top' \| 'none'`             | `'edges'`     | Where the pattern fades into the background. Center keeps the middle calm for a headline.                                                     |
| `fade-size`        | `number`                                                         | `0.5`         | How far the fade reaches, from 0.05 to 1.                                                                                                     |
| `characters`       | `string`                                                         | `'.:-=+*#%@'` | Characters for the glyph pattern, from the lightest to the densest.                                                                           |
| `interactive`      | `boolean`                                                        | `true`        | Lets the cursor disturb the surface. Moving it leaves a wake of ripples, a click drops a splash.                                              |
| `cursor-size`      | `number`                                                         | `50`          | Radius of the patch of surface the cursor pushes, in CSS pixels.                                                                              |
| `cursor-strength`  | `number`                                                         | `0.6`         | How hard the cursor pushes the surface, from 0 to 1.                                                                                          |
| `intro`            | `boolean`                                                        | `true`        | On mount the marks fade in from the center, then the surface rises.                                                                           |
| `paused`           | `boolean`                                                        | `false`       | Freezes the surface. The cursor ripples keep working.                                                                                         |
| `class`            | `string`                                                         | `''`          | Extra classes for the root element.                                                                                                           |
| `style`            | `StyleValue`                                                     | —             | Inline styles for the root element.                                                                                                           |

## Accessibility

- The canvas has `aria-hidden="true"`. The effect is decorative and carries no information.
- Put text and controls on top of it in normal DOM. Pointer events pass through to your content; the component listens on `window`.
- With `prefers-reduced-motion: reduce`, the surface stays still, the intro is skipped and cursor ripples are off.
- The render loop sleeps when the surface is still and when it is off screen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/pattern-waves) by David Haz.
