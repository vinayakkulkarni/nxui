---
title: Stroke Text
description: Outlined SVG letterforms draw themselves on one by one, then flood with fill by wipe or fade, with optional dashed or dotted marching outlines and a lifted shadow.
---

# Stroke Text

The text is rendered as SVG glyphs. Each letter outline draws itself on with a staggered stroke, then the fill floods in with a wipe from any edge or a fade. Outlines can be solid, dashed or dotted, and dashed or dotted outlines can keep flowing around the letters. Filled letters can lift off the page with a soft offset shadow. Hover the text to redraw the outline, or set the trigger to play on hover, on scroll or in a loop.

::demo-stroke-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stroke-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import StrokeText from '~/components/ui/stroke-text/StrokeText.vue';
</script>

<template>
  <StrokeText
    text="Draw Attention"
    stroke-color="#38bdf8"
    wipe-from="bottom"
    ease="expo.out"
    :stroke-width="2"
    :draw-duration="1.2"
    shadow
    hover-redraw
  />
</template>
```

The SVG scales down to its container width and never grows past the measured text width.

## Props

| Prop             | Type                                       | Default            | Description                                                                                                                     |
| ---------------- | ------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `text`           | `string`                                   | `'Draw Attention'` | The heading copy rendered as measured SVG glyphs.                                                                               |
| `stroke-color`   | `string`                                   | `'#A78BFA'`        | Color of the drawing outline.                                                                                                   |
| `fill-color`     | `string`                                   | `'currentColor'`   | Color that floods into the glyphs after the draw. Follows the surrounding text.                                                 |
| `stroke-width`   | `number`                                   | `1.4`              | Outline thickness in SVG units.                                                                                                 |
| `draw-duration`  | `number`                                   | `1.6`              | Seconds each glyph outline takes to draw.                                                                                       |
| `fill-delay`     | `number`                                   | `0.2`              | Seconds between the outline finishing and the fill starting.                                                                    |
| `stagger`        | `number`                                   | `0.05`             | Seconds between each glyph starting to draw.                                                                                    |
| `ease`           | `string`                                   | `'power2.out'`     | GSAP-style ease name for the draw: `power0`–`power4`, `sine`, `expo`, `circ`, `back` with `.in`, `.out` or `.inOut`, or `none`. |
| `trigger`        | `'mount' \| 'hover' \| 'scroll' \| 'loop'` | `'mount'`          | When the animation plays. `loop` draws and undraws forever.                                                                     |
| `fill-mode`      | `'wipe' \| 'fade' \| 'none'`               | `'wipe'`           | How the fill appears after the outline.                                                                                         |
| `wipe-from`      | `'left' \| 'right' \| 'top' \| 'bottom'`   | `'left'`           | Edge the wipe fill starts from.                                                                                                 |
| `font-size`      | `number`                                   | `128`              | Font size in pixels.                                                                                                            |
| `font-weight`    | `number \| string`                         | `800`              | Font weight.                                                                                                                    |
| `font-family`    | `string`                                   | `'inherit'`        | Font family.                                                                                                                    |
| `letter-spacing` | `number`                                   | `-4`               | Letter spacing in pixels.                                                                                                       |
| `reverse`        | `boolean`                                  | `false`            | Stagger from the last glyph to the first.                                                                                       |
| `stroke-style`   | `'solid' \| 'dashed' \| 'dotted'`          | `'solid'`          | Outline style.                                                                                                                  |
| `dash-length`    | `number`                                   | `10`               | Dash or dot spacing for dashed and dotted outlines.                                                                             |
| `marching`       | `boolean`                                  | `false`            | Dashed and dotted outlines keep flowing around the letters.                                                                     |
| `hover-redraw`   | `boolean`                                  | `false`            | Redraws the outline on hover after the first draw (not with `hover` or `loop`).                                                 |
| `shadow`         | `boolean`                                  | `false`            | Filled letters lift off the page with a soft offset shadow.                                                                     |
| `shadow-color`   | `string`                                   | stroke color       | Shadow color.                                                                                                                   |
| `class`          | `string`                                   | `''`               | Extra classes for the root.                                                                                                     |

## Accessibility

- The root has `role="img"` and an `aria-label` with the text. The SVG is `aria-hidden`.
- With `prefers-reduced-motion`, the text renders in its final drawn and filled state, with no marching or hover redraw.
- The `scroll` trigger plays once when the text reaches 82% of the viewport height.

- Ported from [React Bits](https://reactbits.dev/text-animations/stroke-text) by David Haz.
