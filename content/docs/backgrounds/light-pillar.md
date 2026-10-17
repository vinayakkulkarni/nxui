---
title: Light Pillar
description: A swirling pillar of light that ignites on load, leans toward the cursor and surges on click.
---

A raymarched pillar of light strands drawn with raw WebGL2. It ignites from the bottom when it mounts. Move the cursor over it and the pillar leans, drifts and turns toward you. Click to send a surge of light up the pillar.

::demo-light-pillar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/light-pillar.json"
```

## Usage

```vue
<script setup lang="ts">
  import LightPillar from '~/components/ui/light-pillar/LightPillar.vue';
</script>

<template>
  <div class="relative h-150 w-full overflow-hidden bg-black">
    <LightPillar
      top-color="#5227FF"
      bottom-color="#FF9FFC"
      :pillar-rotation="25"
      :bloom="0.5"
    />
  </div>
</template>
```

The strands render at a reduced resolution into a mipmapped buffer, then a
second pass upscales them with a bicubic filter and adds bloom, grain and
pulses. The render scale drops on its own when frames run slow. The loop
stops when the pillar is paused and settled, off screen, or the tab is hidden.

## Props

| Prop              | Type                          | Default     | Description                                                                         |
| ----------------- | ----------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `top-color`       | `string`                      | `'#5227FF'` | Color of the lower, denser part of the pillar.                                      |
| `bottom-color`    | `string`                      | `'#FF9FFC'` | Color the light fades into toward the top.                                          |
| `intensity`       | `number`                      | `1`         | Overall brightness.                                                                 |
| `glow-amount`     | `number`                      | `0.002`     | How much light the strands gather. Higher values burn brighter and whiter.          |
| `bloom`           | `number`                      | `0.5`       | Soft halo around the brightest strands, 0 to 1.                                     |
| `pillar-width`    | `number`                      | `3`         | Width of the pillar.                                                                |
| `pillar-height`   | `number`                      | `0.4`       | Vertical stretch of the strands. Higher values pack them tighter.                   |
| `pillar-rotation` | `number`                      | `25`        | Tilts the pillar, in degrees.                                                       |
| `twist`           | `number`                      | `0.4`       | How much the strands swirl around each other.                                       |
| `detail`          | `number`                      | `4`         | Layers of turbulence in the strands, 1 to 6. Fewer layers are smoother and faster.  |
| `rotation-speed`  | `number`                      | `0.3`       | How fast the pillar turns. Also drives the overall animation speed.                 |
| `flow`            | `number`                      | `1`         | How fast the light streams along the pillar, relative to the rotation.              |
| `noise-intensity` | `number`                      | `0.5`       | Strength of the film grain.                                                         |
| `interactive`     | `boolean`                     | `true`      | The pillar leans, drifts and turns toward the cursor.                               |
| `click-pulse`     | `boolean`                     | `true`      | Clicking sends a surge of light racing up the pillar.                               |
| `intro`           | `boolean`                     | `true`      | The pillar ignites from the bottom and widens when it first appears.                |
| `fade`            | `number`                      | `0`         | Fades the edges into the page, 0 to 1.                                              |
| `quality`         | `'low' \| 'medium' \| 'high'` | `'high'`    | Render resolution of the light. The pillar is soft, so lower settings look similar. |
| `resolution`      | `number`                      | —           | Exact render scale relative to the element size, 0.25 to 2. Overrides `quality`.    |
| `mix-blend-mode`  | `string`                      | `'screen'`  | CSS blend mode for the canvas. Screen lets the page show through the dark areas.    |
| `light-mode`      | `boolean`                     | `false`     | Draws the pillar as colored light on a white background.                            |
| `paused`          | `boolean`                     | `false`     | Freezes the animation.                                                              |
| `class`           | `string`                      | `''`        | Extra classes merged onto the container.                                            |

The component is absolutely positioned and fills its nearest positioned parent.
On a light page, use `light-mode` with `mix-blend-mode="normal"`; screen
blending disappears against white.

## Accessibility

- The canvas is decorative (`aria-hidden="true"`). Pointer input is read from the window, so it never blocks content placed on top.
- With `prefers-reduced-motion: reduce`, the pillar renders one still frame: no rotation, intro, cursor lean or click surges.

- Ported from [React Bits](https://reactbits.dev/backgrounds/light-pillar) by David Haz.
