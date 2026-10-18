---
title: Faulty Terminal
description: A flickering CRT terminal of glowing glyphs, with phosphor trails under the cursor and glitches on click.
---

Faulty Terminal draws a grid of glowing glyphs on a curved CRT, driven by a swirling noise pattern. Glyphs switch on one by one when it mounts, keep glowing after they switch off like real phosphor, and heat up around the cursor. Move the cursor to leave trails; click to tear the screen or send a degauss wave.

::demo-faulty-terminal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/faulty-terminal.json"
```

## Usage

```vue
<script setup lang="ts">
  import FaultyTerminal from '~/components/ui/faulty-terminal/FaultyTerminal.vue';
</script>

<template>
  <div class="relative size-full min-h-80 overflow-hidden">
    <FaultyTerminal
      class="absolute inset-0 size-full"
      tint="#A7EF9E"
      glyphs="blocks"
      :scale="1.5"
      :digit-size="1.2"
      :time-scale="0.5"
      :brightness="0.75"
      :persistence="0.5"
      click-effect="glitch"
    />
  </div>
</template>
```

The demo presets (Phosphor, Classic, Terminal, Amber, Ice, Meltdown, Data) ship with the component. `faultyTerminalPreset('amber')` returns the full set of visual props; pass `true` as the second argument for the light-page variant.

```vue
<script setup lang="ts">
  import {
    FaultyTerminal,
    faultyTerminalPreset,
  } from '~/components/ui/faulty-terminal';

  const amber = faultyTerminalPreset('amber');
</script>

<template>
  <FaultyTerminal v-bind="amber" />
</template>
```

## Props

| Prop                   | Type                                 | Default     | Description                                                                                             |
| ---------------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| `tint`                 | `string`                             | `'#ffffff'` | Phosphor color of the glyphs. In light mode, light colors are deepened so they print clearly.           |
| `glyphs`               | `'blocks' \| 'dots' \| 'characters'` | `'blocks'`  | What each cell draws: squares of lit pixels, round LED dots, or terminal characters that keep changing. |
| `scale`                | `number`                             | `1`         | Zoom of the pattern. Higher values show more, smaller glyphs.                                           |
| `grid-mul`             | `[number, number]`                   | `[2, 1]`    | Glyph density across and down, multiplied with scale.                                                   |
| `digit-size`           | `number`                             | `1.5`       | Space around each glyph. 1 packs them edge to edge, higher values leave wider gaps.                     |
| `time-scale`           | `number`                             | `0.3`       | Speed of the animation.                                                                                 |
| `brightness`           | `number`                             | `1`         | Overall brightness of the screen, or ink strength in light mode.                                        |
| `glow`                 | `number`                             | `0.5`       | Phosphor bloom around the glyphs, with richer color in the halo and paler bright cores.                 |
| `persistence`          | `number`                             | `0.5`       | How long glyphs keep glowing after they switch off. Leaves trails behind the cursor.                    |
| `mouse-react`          | `boolean`                            | `true`      | Lights up the glyphs around the cursor. The light rests in the middle while the cursor is away.         |
| `mouse-strength`       | `number`                             | `0.2`       | How many glyphs the cursor lights up around it.                                                         |
| `mouse-glow`           | `number`                             | `0.6`       | How much the glyphs under the cursor heat up toward white while you move.                               |
| `scramble`             | `number`                             | `0.5`       | How fast characters change near the cursor. Only used with `characters`.                                |
| `click-effect`         | `'glitch' \| 'degauss' \| 'none'`    | `'glitch'`  | What a click does: tear the screen into shifting bands, or send a wobbling degauss wave.                |
| `scanline-intensity`   | `number`                             | `0.3`       | Strength of the soft halo and the bright band that rolls down the screen.                               |
| `glitch-amount`        | `number`                             | `1`         | How far the faulty bands of the screen shift sideways.                                                  |
| `flicker-amount`       | `number`                             | `1`         | How often the faulty bands appear.                                                                      |
| `noise-amp`            | `number`                             | `1`         | Strength of the swirling pattern that decides which glyphs light up.                                    |
| `chromatic-aberration` | `number`                             | `0`         | Splits the red and blue channels apart, in pixels.                                                      |
| `curvature`            | `number`                             | `0.2`       | Bulge of the screen, like the glass of an old tube.                                                     |
| `vignette`             | `number`                             | `0.25`      | Darkens the edges of the screen so it fades into the page.                                              |
| `dither`               | `number \| boolean`                  | `0`         | Fine noise that smooths color banding.                                                                  |
| `page-load-animation`  | `boolean`                            | `true`      | Switches the glyphs on one by one, each with a short phosphor flash, on mount.                          |
| `pause`                | `boolean`                            | `false`     | Freezes the animation. The cursor still lights up glyphs.                                               |
| `variation`            | `number`                             | random      | Picks a fixed pattern. Leave it out for a different one on every mount.                                 |
| `light-mode`           | `boolean`                            | `false`     | Prints the glyphs as crisp ink on a light page.                                                         |
| `dpr`                  | `number`                             | auto        | Maximum device pixel ratio, capped at 2.                                                                |
| `class`                | `string`                             | `''`        | Extra classes for the container.                                                                        |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`; put real content on top of it.
- With `prefers-reduced-motion: reduce`, the pattern holds still, the glitch bands and flicker turn off, the intro is skipped and clicks do nothing. The cursor glow still follows the pointer.
- The render loop stops when the terminal is offscreen, when the tab is hidden, and after the picture has been still for 2.5 seconds.

- Ported from [React Bits](https://reactbits.dev/backgrounds/faulty-terminal) by David Haz.
