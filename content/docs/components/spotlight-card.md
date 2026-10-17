---
title: Spotlight Card
description: Card lit by a soft spotlight that follows the pointer, catches its edge and reaches nearby cards.
---

A card with a soft light that trails the pointer, glows along the card edge and swells while the card is pressed. With `proximity` the light starts to reach the card before the pointer enters, so a grid of cards shares one light. Keyboard focus moves the light to the focused control.

::demo-spotlight-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/spotlight-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import SpotlightCard from '~/components/ui/spotlight-card/SpotlightCard.vue';
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <SpotlightCard class="text-white" shape="beam" :proximity="120">
      <h3 class="text-lg font-medium">Shared light</h3>
      <p class="text-sm text-white/60">Neighbouring cards catch the glow.</p>
    </SpotlightCard>
    <SpotlightCard class="text-white" shape="beam" :proximity="120">
      <h3 class="text-lg font-medium">Beam shape</h3>
      <p class="text-sm text-white/60">Light pours down from the top edge.</p>
    </SpotlightCard>
  </div>
</template>
```

The card ships with `rounded-3xl p-8` and a surface, border and shadow taken from `theme`. Override padding and radius with classes, and the colours with the `--spotlight-card-surface` and `--spotlight-card-border` CSS variables.

## Props

| Prop              | Type                 | Default     | Description                                                                                                    |
| ----------------- | -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `spotlight-color` | `string`             | `undefined` | Colour of the light. Any CSS colour, alpha is respected. Defaults to white on dark cards, near black on light. |
| `intensity`       | `number`             | `0.15`      | Brightness of the light on the card surface, 0 to 1.                                                           |
| `spotlight-size`  | `number`             | `240`       | Radius of the light in px.                                                                                     |
| `softness`        | `number`             | `0.7`       | How gradually the light fades. 0 is a crisp disc, 1 a soft glow.                                               |
| `shape`           | `'circle' \| 'beam'` | `'circle'`  | Round light around the pointer, or a beam pouring down from the top edge toward it.                            |
| `border-glow`     | `number`             | `0.6`       | How much the card edge catches the light, 0 to 1.                                                              |
| `proximity`       | `number`             | `80`        | Distance in px outside the card at which the light starts to reach it. 0 lights the card only on hover.        |
| `smoothing`       | `number`             | `0.3`       | How far the light floats behind the pointer. 0 sticks to it.                                                   |
| `ambient`         | `boolean`            | `false`     | Lets the light drift across the card while nothing points at it, useful on touch screens.                      |
| `flare`           | `boolean`            | `true`      | The light swells and brightens while the card is pressed.                                                      |
| `grain`           | `number`             | `0`         | Film grain inside the light, 0 to 1. A little removes banding in large soft gradients.                         |
| `theme`           | `'dark' \| 'light'`  | `'dark'`    | Surface, border and light treatment for dark or light pages.                                                   |
| `class`           | `string`             | `''`        | Extra classes for the card. Other attributes fall through to the root `div`.                                   |

## Slots

| Slot      | Description          |
| --------- | -------------------- |
| `default` | Content of the card. |

## Accessibility

- The light layers are decorative and marked `aria-hidden`.
- When a control inside the card gets keyboard focus (`:focus-visible`), the light moves to it.
- With `prefers-reduced-motion: reduce` the light jumps to the pointer without easing, the press flare is off and the ambient drift stops.

## Credits

- Ported from [React Bits](https://reactbits.dev/components/spotlight-card) by David Haz.
