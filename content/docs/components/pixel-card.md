---
title: Pixel Card
description: A card that fills with twinkling pixels in a glowing reveal wave from the center or the cursor, on hover, click or always on.
---

A card with a canvas of crisp pixels behind its content. Hover or focus the card and the pixels pop in as a wave from the center (or from where the pointer entered), twinkle, swell under a soft spotlight that follows the cursor and ripple out from every click. Set `trigger` to `click` to toggle it, or `always` to keep it on. `fade` clears the middle so text stays readable. In the demo the featured plan is always on; pick a preset, scene and trigger in the panel.

::demo-pixel-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelCard from '~/components/ui/pixel-card/PixelCard.vue';
</script>

<template>
  <!-- A ready-made palette -->
  <PixelCard variant="blue">
    <h3 class="text-xl font-semibold">Hover me</h3>
  </PixelCard>

  <!-- Custom look, sized with classes -->
  <PixelCard
    class="h-93 w-60"
    :colors="['#ccfbf1', '#5eead4', '#14b8a6']"
    glow-color="#14b8a6"
    :gap="9"
    :pixel-size="4"
    shape="circle"
    origin="pointer"
    :spotlight="1"
    :opacity="0.35"
    :fade="0.7"
    trigger="click"
    :intro-delay="140"
  >
    <p class="text-sm font-semibold">Pro</p>
  </PixelCard>
</template>
```

The card is `300 × 400` by default; pass size classes (`class="size-full"`, `class="h-93 w-60"`) to change it. Content is centered and sits above the pixels.

## Props

| Prop              | Type                                        | Default      | Description                                                                                    |
| ----------------- | ------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `variant`         | `'default' \| 'blue' \| 'yellow' \| 'pink'` | `'default'`  | A ready-made palette with its own gap and speed. Any prop you pass overrides it.               |
| `colors`          | `string \| string[]`                        | From variant | Pixel colors, as an array or a comma-separated string. Each pixel picks one at random.         |
| `glow-color`      | `string`                                    | From variant | Color of the soft light that follows the cursor across the card.                               |
| `gap`             | `number`                                    | From variant | Distance between pixels, in px.                                                                |
| `pixel-size`      | `number`                                    | `2`          | Largest size a pixel grows to, in px.                                                          |
| `speed`           | `number`                                    | From variant | How fast the pixels twinkle, from 0 to 100. 0 holds them still.                                |
| `shape`           | `'square' \| 'circle' \| 'diamond'`         | `'square'`   | Shape of each pixel.                                                                           |
| `origin`          | `'center' \| 'pointer'`                     | `'center'`   | Where the reveal wave starts: the middle of the card, or where the pointer enters.             |
| `reveal-duration` | `number`                                    | `600`        | How long the wave takes to sweep across the card, in ms.                                       |
| `spotlight`       | `number`                                    | `0.5`        | How much pixels near the cursor swell and brighten, from 0 to 1.                               |
| `glow`            | `number`                                    | `0.5`        | Strength of the soft light under the pixels.                                                   |
| `opacity`         | `number`                                    | `1`          | Opacity of the pixels and glow. Lower it to keep text on the card easy to read.                |
| `fade`            | `number`                                    | `0`          | Fades the pixels out toward the middle so they frame your content, from 0 to 1.                |
| `trigger`         | `'hover' \| 'click' \| 'always'`            | `'hover'`    | What turns the effect on: hovering or focusing the card, clicking it on and off, or always on. |
| `click-pulse`     | `boolean`                                   | `true`       | Clicking sends a ripple of brighter pixels out from the click.                                 |
| `intro`           | `boolean`                                   | `true`       | Plays the reveal once when the card first scrolls into view.                                   |
| `intro-delay`     | `number`                                    | `0`          | Wait before the intro, in ms. Stagger it across a row of cards.                                |
| `no-focus`        | `boolean`                                   | From variant | Stops keyboard focus from triggering the effect.                                               |
| `theme`           | `'dark' \| 'light'`                         | `'dark'`     | Color theme of the card surface and default palette.                                           |
| `radius`          | `number`                                    | `24`         | Corner radius of the card, in px.                                                              |
| `class`           | `string`                                    | `''`         | Extra classes, merged with the default `h-100 w-75` size.                                      |

## Slots

| Slot      | Description                                             |
| --------- | ------------------------------------------------------- |
| `default` | Card content. It is centered and sits above the pixels. |

The root carries `data-active` while the effect is on, so content can react with `group-data-active:` classes.

## Accessibility

- The card is focusable (unless `no-focus`); focus turns the effect on in hover mode.
- In click mode the card is a `button` with `aria-pressed`; Enter and Space toggle it, and a click outside turns it off.
- The canvas is `aria-hidden`. With `prefers-reduced-motion`, pixels appear without the wave, twinkle, spotlight or ripples.
- The animation pauses when the card is off screen.

- Ported from [React Bits](https://reactbits.dev/components/pixel-card) by David Haz.
