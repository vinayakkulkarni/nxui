---
title: Scanner
description: Glowing interference lines swept by a scan beam, with a CRT finish, cursor lensing and click pings.
---

A WebGL2 field of wavy interference lines that a scan beam sweeps across, leaving an afterglow trail. Move the cursor to part the lines around it, and click to send a ping rippling out. The lines power on with a first scan, and light mode draws them as crisp ink.

::demo-scanner
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scanner.json"
```

## Usage

```vue
<script setup lang="ts">
  import Scanner from '~/components/ui/scanner/Scanner.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Scanner
      color1="#5227FF"
      color2="#FF9FFC"
      color3="#FFFFFF"
      scan-direction="vertical"
      mouse-mode="repel"
    />
  </div>
</template>
```

## Props

| Prop                 | Type                                       | Default            | Description                                                                   |
| -------------------- | ------------------------------------------ | ------------------ | ----------------------------------------------------------------------------- |
| `color1`             | `string`                                   | `'#5227FF'`        | Color of the resting lines.                                                   |
| `color2`             | `string`                                   | `'#FF9FFC'`        | Color the lines take as the scan lights them.                                 |
| `color3`             | `string`                                   | `'#FFFFFF'`        | Color of the hot scan head itself.                                            |
| `speed`              | `number`                                   | `0.5`              | How fast the wave moves through the lines.                                    |
| `sweep-speed`        | `number`                                   | `0.25`             | How fast the scan travels across.                                             |
| `sweep-width`        | `number`                                   | `1.6`              | Distance between one scan and the next. Larger values leave longer dark gaps. |
| `trail`              | `number`                                   | `0.5`              | Length of the afterglow the scan leaves behind, from 0 to 1.                  |
| `reverse`            | `boolean`                                  | `false`            | Runs the scan in the opposite direction.                                      |
| `scale`              | `number`                                   | `1.5`              | Zooms the whole pattern in or out.                                            |
| `frequency`          | `number`                                   | `2`                | How many waves fit across the field.                                          |
| `ripple`             | `number`                                   | `0.22`             | How tall the waves are. 0 keeps the lines straight.                           |
| `band-density`       | `number`                                   | `11`               | How many lines fill the field.                                                |
| `line-width`         | `number`                                   | `1.2`              | Width of the resting lines, in px. Lit lines get thicker.                     |
| `glow`               | `number`                                   | `0.6`              | Soft glow around the lit lines.                                               |
| `scan-direction`     | `'vertical' \| 'horizontal' \| 'diagonal'` | `'vertical'`       | Direction the scan travels in. The lines run across it.                       |
| `color-spread`       | `number`                                   | `0.7`              | Fine color fringes on the edges of lit lines, from 0 to 1.                    |
| `brightness`         | `number`                                   | `1`                | Overall brightness of the lines.                                              |
| `vignette`           | `number`                                   | `0.3`              | Fades the lines out toward the edges, from 0 to 1.                            |
| `scanline`           | `boolean`                                  | `true`             | Turns on the CRT look: fine horizontal scanlines across the field.            |
| `scanline-intensity` | `number`                                   | `0.5`              | How dark the scanlines are, from 0 to 1.                                      |
| `grain`              | `boolean`                                  | `true`             | Adds a little film grain.                                                     |
| `grain-intensity`    | `number`                                   | `0.04`             | Strength of the grain.                                                        |
| `opacity`            | `number`                                   | `1`                | Overall opacity of the effect.                                                |
| `mouse-interaction`  | `boolean`                                  | `true`             | The lines bend around the cursor and light up near it.                        |
| `mouse-mode`         | `'repel' \| 'attract'`                     | `'repel'`          | Lines part around the cursor, or pinch in toward it.                          |
| `mouse-radius`       | `number`                                   | `0.5`              | Size of the area around the cursor.                                           |
| `mouse-strength`     | `number`                                   | `0.7`              | How strongly the cursor bends the lines.                                      |
| `click-effect`       | `'ping' \| 'none'`                         | `'ping'`           | Clicking sends a ring of light rippling out through the lines.                |
| `intro`              | `boolean`                                  | `true`             | The lines power on with a first scan on mount.                                |
| `light-mode`         | `boolean`                                  | `false`            | Draws the lines as crisp ink for light backgrounds instead of glowing light.  |
| `dpr`                | `number`                                   | `devicePixelRatio` | Maximum device pixel ratio, capped at 2.                                      |
| `class`              | `string`                                   | `''`               | Additional CSS classes for the container.                                     |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the wave and the scan hold still and click pings are disabled. The render loop pauses when the effect is offscreen or the tab is hidden, and sleeps once nothing moves.

- Ported from [React Bits](https://reactbits.dev/backgrounds/scanner) by David Haz.
