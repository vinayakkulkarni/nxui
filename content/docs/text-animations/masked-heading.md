---
title: Masked Heading
description: A headline with an image or looping video showing through the letters, revealed by rise, scale, blur, wipe or fade, with pointer parallax and an optional spotlight.
---

The letters of a heading become a window onto an image or a muted looping video. The media drifts slowly and slides under the letters as the pointer moves; turn on `spotlight` to dim everything except a soft pool of light that follows the pointer. The heading enters with a word rise, letter-by-letter scale, blur, wipe or fade — when it scrolls into view, on mount, or on hover.

::demo-masked-heading
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/masked-heading.json"
```

## Usage

```vue
<script setup lang="ts">
  import MaskedHeading from '~/components/ui/masked-heading/MaskedHeading.vue';
</script>

<template>
  <MaskedHeading
    tag="h1"
    text="Shot on location"
    src="https://images.unsplash.com/photo-1500673587002-1d2548cfba1b?w=1600"
    reveal="rise"
    spotlight
    :spotlight-radius="200"
    :hover-zoom="0.06"
  />
</template>
```

The visible letters are a real heading element (transparent text keeps it
selectable and readable by assistive tech); an SVG `clipPath` built from each
measured glyph cuts the media to the letter shapes, and the entrance animates
those glyphs.

## Props

| Prop               | Type                                                        | Default                     | Description                                                       |
| ------------------ | ----------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `text`             | `string`                                                    | `'Designed in the details'` | Heading copy                                                      |
| `tag`              | `string`                                                    | `'h2'`                      | Element the heading renders as                                    |
| `media-type`       | `'image' \| 'video'`                                        | `'image'`                   | Image, or a muted looping video                                   |
| `src`              | `string`                                                    | `''`                        | Image or video URL                                                |
| `poster`           | `string`                                                    | `''`                        | Poster frame used while a video loads                             |
| `reveal`           | `'rise' \| 'scale' \| 'blur' \| 'wipe' \| 'fade' \| 'none'` | `'rise'`                    | Entrance style                                                    |
| `trigger`          | `'view' \| 'mount' \| 'hover'`                              | `'view'`                    | When the entrance runs                                            |
| `duration`         | `number`                                                    | `1.1`                       | Entrance duration, in seconds                                     |
| `stagger`          | `number`                                                    | `0.09`                      | Delay between words (rise); letters step at about a third (scale) |
| `spotlight`        | `boolean`                                                   | `false`                     | Dims the media except for a pool of light following the pointer   |
| `spotlight-radius` | `number`                                                    | `160`                       | Spotlight radius, in px                                           |
| `outline`          | `boolean`                                                   | `false`                     | Strokes every letter, visible before the entrance fills it        |
| `outline-color`    | `string`                                                    | `''`                        | Outline color; empty follows the text color                       |
| `outline-width`    | `number`                                                    | `1`                         | Outline thickness, in px                                          |
| `fill-scale`       | `number`                                                    | `1.25`                      | How far the media is zoomed past the heading (parallax overscan)  |
| `parallax`         | `number`                                                    | `26`                        | How far the media slides with the pointer, in px                  |
| `drift`            | `number`                                                    | `18`                        | Amplitude of the slow idle motion, in px; `0` holds still         |
| `hover-zoom`       | `number`                                                    | `0`                         | Extra zoom while hovered (`0.1` = 10% closer)                     |
| `brightness`       | `number`                                                    | `1`                         | Brightness of the media                                           |
| `saturation`       | `number`                                                    | `1`                         | Saturation of the media                                           |
| `grayscale`        | `boolean`                                                   | `false`                     | Render the media in black and white                               |
| `tint`             | `string`                                                    | `''`                        | Colorizes the media in one color, like a duotone print            |
| `align`            | `'left' \| 'center' \| 'right'`                             | `'center'`                  | Text alignment                                                    |
| `weight`           | `number`                                                    | `700`                       | Font weight                                                       |
| `tracking`         | `number`                                                    | `-0.03`                     | Letter spacing, in em                                             |
| `line-height`      | `number`                                                    | `1.06`                      | Line height                                                       |
| `text-scale`       | `number`                                                    | `0.115`                     | Type size as a fraction of the container width                    |
| `class`            | `string`                                                    | —                           | Additional classes on the root element                            |

Other attributes (`id`, `aria-*`) pass through to the heading element.

## Accessibility

- Renders a real heading (`tag`), so document outline and screen readers get the text; the media and SVG layers are `aria-hidden` / decorative.
- With `prefers-reduced-motion: reduce` the entrance is skipped, drift and parallax stop and videos stay paused.
- The idle loop pauses while the heading is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/masked-heading) by David Haz.
