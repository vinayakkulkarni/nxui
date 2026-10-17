---
title: Particle Text
description: Text assembles from drifting particles that scatter and reform on demand — gather, rain, spiral or scan intros, cursor repel and click bursts.
---

Text is sampled into a few thousand canvas particles that fly in and settle into the glyphs. Move the cursor through the text to push particles aside; click to blow them apart and watch them spring back. Particles light up in the highlight color while they are away from their spot.

::demo-particle-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/particle-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import ParticleText from '~/components/ui/particle-text/ParticleText.vue';
</script>

<template>
  <div class="relative h-100 w-full">
    <ParticleText
      text="Future Interfaces"
      highlight-color="#ff5a36"
      intro="spiral"
      shape="circle"
      :pointer-repel="42"
      :click-burst="true"
    />
  </div>
</template>
```

The component fills its parent (minimum height 240px), so give the parent a real height.

## Props

| Prop              | Type                                       | Default                     | Description                                                                                                  |
| ----------------- | ------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `text`            | `string`                                   | `'nxui'`                    | The words sampled into particle targets                                                                      |
| `color`           | `string`                                   | `'currentColor'`            | Particle color at rest. Follows the surrounding text color by default                                        |
| `highlight-color` | `string`                                   | `'#ff5a36'`                 | Color particles take on while they fly in or get pushed. Also colors the glow and the scan line              |
| `intro`           | `'gather' \| 'rain' \| 'spiral' \| 'scan'` | `'gather'`                  | How the text forms: pull together, drop from above, swirl into place, or print behind a sweeping line        |
| `gather-duration` | `number`                                   | `1600`                      | Milliseconds for the intro to form the text                                                                  |
| `stagger`         | `number`                                   | `420`                       | Maximum per-particle delay in milliseconds                                                                   |
| `scatter`         | `number`                                   | `180`                       | How far particles begin from their spots in the gather and spiral intros                                     |
| `trigger`         | `'mount' \| 'hover' \| 'click'`            | `'mount'`                   | When the intro plays again after the first formation: never, on hover, or on click                           |
| `click-burst`     | `boolean`                                  | `true`                      | Clicking blows particles away from the click point, then they spring back. Off while `trigger` is `click`    |
| `burst-strength`  | `number`                                   | `1`                         | How hard and how wide a click burst pushes                                                                   |
| `pointer-repel`   | `number`                                   | `40`                        | Strength of the cursor pushback                                                                              |
| `repel-radius`    | `number`                                   | `120`                       | Cursor influence radius in pixels                                                                            |
| `idle-drift`      | `number`                                   | `0.7`                       | Subtle resting motion after the text has formed                                                              |
| `shape`           | `'circle' \| 'square' \| 'line'`           | `'circle'`                  | How each particle is drawn. `line` strokes stretch along their motion and settle into an even hatch          |
| `highlight-mode`  | `'motion' \| 'gradient'`                   | `'motion'`                  | `motion` lights particles while they are away from their spot; `gradient` blends the highlight left to right |
| `particle-size`   | `number`                                   | `2`                         | Rendered size of each particle in CSS pixels                                                                 |
| `density`         | `number`                                   | `4`                         | Pixel sampling step for the glyph canvas. Lower values create more particles                                 |
| `glow`            | `boolean`                                  | `true`                      | Soft bloom in the highlight color around highlighted particles                                               |
| `font-size`       | `number \| string`                         | `'clamp(3rem, 12vw, 8rem)'` | Text size used for glyph sampling (px number or any CSS length). Shrinks to fit 92% of the width             |
| `font-weight`     | `number \| string`                         | `800`                       | Font weight used for sampling                                                                                |
| `font-family`     | `string`                                   | `'inherit'`                 | Font family used for sampling. `inherit` waits for the surrounding font before sampling                      |
| `class`           | `string`                                   | `''`                        | Extra classes on the wrapper                                                                                 |

## Accessibility

- The canvas is `aria-hidden`; the text is rendered in a visually hidden span so screen readers read it.
- With `prefers-reduced-motion: reduce` the intro, bursts, repel and drift are skipped and the text renders in place.
- The animation loop sleeps when everything is at rest and pauses while the component is offscreen.

- Ported from [React Bits](https://reactbits.dev/text-animations/particle-text) by David Haz.
