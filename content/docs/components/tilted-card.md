---
title: Tilted Card
description: A 3D card that tilts toward the cursor, with glare, a soft shadow, floating depth layers and a flip side.
---

A 3D card that leans toward the cursor on springs, catches a moving glare on its face and edges, and lifts a soft shadow. Hover to tilt, click, tap or press Enter to flip it over, and wrap content in `TiltedCardLayer` to float it above the photo with parallax.

::demo-tilted-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/tilted-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import { TiltedCard, TiltedCardLayer } from '~/components/ui/tilted-card';
</script>

<template>
  <div class="aspect-square w-75">
    <TiltedCard
      image-src="/covers/open-sky.webp"
      alt-text="Open Sky album cover"
      caption-text="Open Sky — Blue Hour"
      container-width="100%"
      container-height="100%"
      image-width="100%"
      image-height="100%"
      @flip="(flipped) => console.log(flipped)"
    >
      <TiltedCardLayer :depth="28">
        <div class="absolute bottom-4 left-4 text-white">Open Sky</div>
      </TiltedCardLayer>

      <template #back>
        <div class="absolute inset-0 bg-card p-4">Track list</div>
      </template>
    </TiltedCard>
  </div>
</template>
```

One spring simulation drives tilt, lift, flip, press and the caption tag, and it sleeps once everything settles. With no pointer, the card can follow the phone's tilt (`gyroscope`), drift on its own (`floating`) or follow the cursor anywhere on the page (`track-window`).

## Props

| Prop                      | Type                                   | Default               | Description                                                                       |
| ------------------------- | -------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `image-src`               | `string`                               | —                     | Photo that fills the card.                                                        |
| `alt-text`                | `string`                               | `'Tilted card image'` | Alternative text for the photo.                                                   |
| `caption-text`            | `string`                               | `''`                  | Text in the small tag that follows the cursor and swings as it moves.             |
| `show-tooltip`            | `boolean`                              | `true`                | Shows the caption tag on hover.                                                   |
| `display-overlay-content` | `boolean`                              | `false`               | Shows the `overlay` slot.                                                         |
| `overlay-depth`           | `number`                               | `30`                  | How far the overlay floats in front, in px.                                       |
| `flip-on-click`           | `boolean`                              | `true`                | Flips the card when it is clicked. Needs the `back` slot.                         |
| `flipped`                 | `boolean`                              | —                     | Controls which side shows (`v-model:flipped`). Leave unset to let clicks flip it. |
| `on-click`                | `(event: MouseEvent \| KeyboardEvent)` | —                     | Called when the card is clicked or activated with the keyboard (`@click`).        |
| `container-width`         | `number \| string`                     | `'100%'`              | Width of the area that reacts to the cursor.                                      |
| `container-height`        | `number \| string`                     | `'300px'`             | Height of the area that reacts to the cursor.                                     |
| `image-width`             | `number \| string`                     | `'300px'`             | Width of the card.                                                                |
| `image-height`            | `number \| string`                     | `'300px'`             | Height of the card.                                                               |
| `rotate-amplitude`        | `number`                               | `12`                  | How far the card tilts toward the cursor, in degrees.                             |
| `scale-on-hover`          | `number`                               | `1.05`                | How much the card grows when hovered.                                             |
| `perspective`             | `number \| string`                     | `800`                 | Viewing distance in px. Lower values give a stronger 3D effect.                   |
| `radius`                  | `number \| string`                     | `15`                  | Corner radius of the card.                                                        |
| `smoothness`              | `number`                               | `0.6`                 | From 0 to 1. Low values snap to the cursor, high values glide with a soft bounce. |
| `glare`                   | `number`                               | `0.5`                 | Strength of the light on the surface and edges as the card tilts, from 0 to 1.    |
| `glare-color`             | `string`                               | `'#ffffff'`           | Color of the glare (hex or rgb).                                                  |
| `shadow`                  | `number`                               | `0.5`                 | Strength of the soft shadow that shifts and grows as the card lifts, from 0 to 1. |
| `parallax`                | `number`                               | `1`                   | How far layers and the photo shift with the tilt. `0` keeps everything flat.      |
| `axis`                    | `'both' \| 'horizontal' \| 'vertical'` | `'both'`              | Limits the tilt to one direction of cursor movement.                              |
| `reverse`                 | `boolean`                              | `false`               | Tilts away from the cursor instead of toward it.                                  |
| `track-window`            | `boolean`                              | `false`               | Follows the cursor anywhere on the page, not only while hovered.                  |
| `floating`                | `boolean`                              | `false`               | Drifts and sways gently while idle.                                               |
| `gyroscope`               | `boolean`                              | `true`                | Tilts with a phone or tablet. Asks for permission on iOS on the first tap.        |
| `intro`                   | `boolean`                              | `true`                | Rises and settles into place when it first scrolls into view.                     |
| `intro-delay`             | `number`                               | `0`                   | Wait before the intro, in ms. Stagger it across a row of cards.                   |
| `class`                   | `string`                               | `''`                  | Extra classes for the root `<figure>`.                                            |

### TiltedCardLayer

| Prop    | Type     | Default | Description                                                               |
| ------- | -------- | ------- | ------------------------------------------------------------------------- |
| `depth` | `number` | `20`    | Parallax depth. Higher values float further; negative values sink behind. |
| `class` | `string` | `''`    | Extra classes for the layer.                                              |

## Events

| Event            | Payload            | Description                                      |
| ---------------- | ------------------ | ------------------------------------------------ |
| `flip`           | `flipped: boolean` | Fired with the new side on every flip.           |
| `update:flipped` | `flipped: boolean` | Enables `v-model:flipped` for a controlled card. |

## Slots

| Slot      | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `default` | Content on the face of the card, over the photo or instead of it. |
| `back`    | Back side of the card. Its presence makes the card flippable.     |
| `overlay` | Content lifted in front of the card (`display-overlay-content`).  |

Tune the look per theme with CSS variables on the root: `--tc-shadow-color`, `--tc-rim-color` and `--tc-rim-light`.

## Accessibility

- When the card can flip or has an `on-click` handler, it becomes a focusable `role="button"` with `aria-pressed` for the flip state; Enter and Space activate it.
- Keyboard focus lifts the card and draws a visible ring on its rim. The hidden face gets `aria-hidden`.
- With `prefers-reduced-motion: reduce`, the tilt drops to 30%, the intro and idle drift are skipped, and the caption no longer swings.
- A drag that moves more than 6px does not count as a click, so scrolling on touch never flips the card.

- Ported from [React Bits](https://reactbits.dev/components/tilted-card) by David Haz.
