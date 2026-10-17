---
title: Hyperspeed
description: Night highway of glowing light trails on a winding road that warps into hyperspace while you hold the pointer down.
---

# Hyperspeed

A three.js night highway. Tail lights stream away on the left road, headlights rush toward you on the right, light poles flick past both shoulders and dust streaks through the air, all wrapped in a soft bloom. The road bends along one of six curve shapes and morphs smoothly when you switch. Click and hold to boost: the traffic speeds up, the trails stretch into warp lines and the camera field of view springs wider. Move the pointer and the camera drifts toward it. The canvas is transparent by default, so your page shows through.

::demo-hyperspeed
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hyperspeed.json"
```

## Usage

```vue
<script setup lang="ts">
  import Hyperspeed from '~/components/ui/hyperspeed/Hyperspeed.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Hyperspeed
      curve="winding"
      :tail-colors="['#d856bf', '#6750a2', '#c247ac']"
      :head-colors="['#03b3c3', '#0e5ea5', '#324555']"
      :pole-colors="['#03b3c3']"
      @boost-start="onBoostStart"
      @boost-end="onBoostEnd"
    />
  </div>
</template>
```

The component fills its nearest positioned parent (`absolute inset-0`).

## Props

| Prop           | Type                                                                   | Default     | Description                                                                                      |
| -------------- | ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `tail-colors`  | `string[]`                                                             | theme       | Colors of the lights moving away on the left road. Defaults to magentas and violet.              |
| `head-colors`  | `string[]`                                                             | theme       | Colors of the oncoming lights on the right road. Defaults to cyan and deep blues.                |
| `pole-colors`  | `string[]`                                                             | theme       | Colors of the light poles along both shoulders.                                                  |
| `curve`        | `'straight' \| 'gentle' \| 'winding' \| 'hills' \| 'racing' \| 'deep'` | `'winding'` | Shape of the road. Switching between curves morphs the road smoothly.                            |
| `curvature`    | `number`                                                               | `1`         | How strongly the road bends. 0 is straight.                                                      |
| `speed`        | `number`                                                               | `1`         | Cruising speed of the traffic, poles and road markings.                                          |
| `boost`        | `number`                                                               | `3`         | Speed multiplier while the pointer is held down. The lights stretch into longer trails.          |
| `fov`          | `number`                                                               | `90`        | Camera field of view in degrees.                                                                 |
| `boost-fov`    | `number`                                                               | `130`       | Field of view while boosting. The camera springs between the two.                                |
| `lanes`        | `number`                                                               | `3`         | Lanes on each side of the road.                                                                  |
| `road-width`   | `number`                                                               | `10`        | Width of each side of the road.                                                                  |
| `median-width` | `number`                                                               | `2`         | Width of the strip between the two sides.                                                        |
| `density`      | `number`                                                               | `40`        | Cars on each side of the road, up to 160.                                                        |
| `trail-length` | `number`                                                               | `1`         | Length of the light trails.                                                                      |
| `light-size`   | `number`                                                               | `1`         | Thickness of the light trails.                                                                   |
| `poles`        | `number`                                                               | `20`        | Light poles on each shoulder, up to 80. 0 removes them.                                          |
| `pole-height`  | `number`                                                               | `1`         | Height of the light poles.                                                                       |
| `dust`         | `number`                                                               | `100`       | Speed streaks flying past in the air, up to 1500. They stretch into warp lines while boosting.   |
| `glow`         | `number`                                                               | `0.6`       | Soft bloom around every light. Dense traffic glows brighter. 0 turns it off.                     |
| `reflections`  | `number`                                                               | `0.5`       | How much the lights reflect on the road, like wet asphalt at night.                              |
| `road-opacity` | `number`                                                               | `0.1`       | Opacity of the road and its markings. Reflections fade with it.                                  |
| `steer`        | `number`                                                               | `0.35`      | How far the camera drifts and turns toward the pointer.                                          |
| `road-color`   | `string`                                                               | theme       | Color of the asphalt. The median takes a slightly lighter shade.                                 |
| `line-color`   | `string`                                                               | theme       | Color of the lane markings.                                                                      |
| `background`   | `string`                                                               | transparent | Color behind the road, which the road fades into. Leave it unset to keep the canvas transparent. |
| `theme`        | `'dark' \| 'light'`                                                    | `'dark'`    | Dark renders glowing light trails. Light renders crisp colored trails on a pale road.            |
| `interactive`  | `boolean`                                                              | `true`      | Click and hold to boost, and let the camera follow the pointer.                                  |
| `boosting`     | `boolean`                                                              | `false`     | Turns the boost on from your own code, for example while something loads.                        |
| `class`        | `string`                                                               | `''`        | Extra classes for the container.                                                                 |

## Events

| Event         | Payload | Description                          |
| ------------- | ------- | ------------------------------------ |
| `boost-start` | —       | Fired when the user starts boosting. |
| `boost-end`   | —       | Fired when the user lets go.         |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`.
- The boost is a pointer-only flourish. Use the `boosting` prop to drive it from your own UI, for example a keyboard-accessible button.
- With `prefers-reduced-motion: reduce`, traffic runs at 30% speed and the field of view no longer springs while boosting.
- Rendering pauses while the component is offscreen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/hyperspeed) by David Haz.
