---
title: Liquid Chrome
description: Soft ribbons of liquid chrome that swirl through a dark pool, ripple under the cursor and catch the light as it moves.
---

Glossy ribbons of liquid metal drawn by a raw WebGL2 shader and lit by a virtual photo studio. The chrome rises from the surface on mount and keeps flowing. Move the cursor to leave a liquid wake and turn the reflections toward it; click to send a ripple across the pool. Pick a preset in the demo panel, switch the site theme for the light studio, or press refresh to replay the intro.

::demo-liquid-chrome
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-chrome.json"
```

## Usage

```vue
<script setup lang="ts">
  import LiquidChrome from '~/components/ui/liquid-chrome/LiquidChrome.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LiquidChrome
      color="#ffffff"
      :speed="0.2"
      :amplitude="0.3"
      :roughness="0.3"
      :ripple-strength="1"
    />
  </div>
</template>
```

The demo presets ship with the component: `liquidChromePreset('mercury')` returns the look of the Satin, Polished, Velvet, Mercury, Molten or Gold preset.

## Props

| Prop                     | Type      | Default     | Description                                                                                     |
| ------------------------ | --------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `color`                  | `string`  | `'#ffffff'` | Color of the metal. White is polished chrome, warmer tones give gold or copper.                 |
| `speed`                  | `number`  | `0.2`       | How fast the chrome flows. 0 freezes it.                                                        |
| `amplitude`              | `number`  | `0.3`       | How strongly the flow swirls and folds (0–2).                                                   |
| `frequency-x`            | `number`  | `3`         | How tightly the flow folds horizontally.                                                        |
| `frequency-y`            | `number`  | `3`         | How tightly the flow folds vertically.                                                          |
| `detail`                 | `number`  | `4`         | Layers of swirl, from 1 to 8. Low values give smooth, heavy shapes, high values intricate ones. |
| `thickness`              | `number`  | `1`         | Width of the chrome ribbons.                                                                    |
| `depth`                  | `number`  | `1`         | How steeply the chrome rises from the surface. Higher values catch more reflections.            |
| `roughness`              | `number`  | `0.3`       | Softens the reflections, from a sharp mirror at 0 to a soft, frosted sheen at 1.                |
| `exposure`               | `number`  | `1`         | Brightness of the reflections.                                                                  |
| `interactive`            | `boolean` | `true`      | The cursor leaves a wake, clicks send ripples out and the reflections follow the cursor.        |
| `ripple-strength`        | `number`  | `1`         | How visible the wake and ripples are.                                                           |
| `ripple-size`            | `number`  | `1`         | Size of the wake and ripples.                                                                   |
| `tilt`                   | `number`  | `1`         | How much the reflections sway and turn toward the cursor. 0 keeps the light still.              |
| `intro`                  | `boolean` | `true`      | The chrome rises from the surface when it mounts.                                               |
| `light-mode`             | `boolean` | `false`     | Lights the chrome for light pages, with soft gray contours instead of a dark studio.            |
| `max-device-pixel-ratio` | `number`  | `2`         | Highest pixel ratio the canvas renders at.                                                      |
| `class`                  | `string`  | `''`        | Extra classes merged on the container.                                                          |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so the chrome never steals focus or clicks from your UI.
- With `prefers-reduced-motion: reduce` there is no intro, no wake and no ripples, the light holds still and the flow slows to a quarter of its speed.
- The render loop stops when the chrome is idle, offscreen or in a hidden tab. If the WebGL context is lost it waits and rebuilds when the browser restores it.

- Ported from [React Bits](https://reactbits.dev/backgrounds/liquid-chrome) by David Haz.
