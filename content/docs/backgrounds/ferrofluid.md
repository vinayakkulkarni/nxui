---
title: Ferrofluid
description: A glossy sea of magnetic fluid where swells of spikes roll in and the cursor raises a crown.
---

A ray-marched sea of black magnetic fluid lit by three studio lights. Swells of spikes roll across the surface, the cursor acts as a magnet that raises a crown of spikes, and a click sends a ring of spikes out from that point. Raw WebGL2, no extra dependencies.

::demo-ferrofluid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ferrofluid.json"
```

## Usage

```vue
<script setup lang="ts">
  import Ferrofluid from '~/components/ui/ferrofluid/Ferrofluid.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Ferrofluid
      :colors="['#ffd2a1', '#ff8a4c', '#ff6a3d']"
      :brightness="1.1"
      :spike-height="1"
      :tilt="48"
      flow-direction="down"
    />
  </div>
</template>
```

The canvas is transparent by default, so the page background shows between the spikes. Set `:transparent="false"` to paint `color` behind the fluid. Use `light-mode` on light pages: the fluid turns into glossy white liquid.

## Props

| Prop                | Type                                            | Default                             | Description                                                                                |
| ------------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `colors`            | `string[]`                                      | `['#ffffff', '#ffffff', '#ffffff']` | Colors of the studio lights reflected in the fluid: key light, side lights and fill light. |
| `brightness`        | `number`                                        | `1`                                 | Strength of the reflections.                                                               |
| `scale`             | `number`                                        | `1.6`                               | Zoom of the fluid. Higher values show bigger, fewer spikes.                                |
| `spike-height`      | `number`                                        | `1`                                 | How tall the spikes grow in a strong field.                                                |
| `sharpness`         | `number`                                        | `2.5`                               | How peaked the spikes are. Low values give soft mounds, high values taller cones.          |
| `tilt`              | `number`                                        | `48`                                | Viewing angle in degrees. Low values look down from above, high values look across.        |
| `turbulence`        | `number`                                        | `1`                                 | How much the spike pattern sways and drifts out of its regular grid.                       |
| `fluidity`          | `number`                                        | `0.5`                               | How loosely the spikes respond, from 0 (thick and slow) to 1 (bouncy).                     |
| `speed`             | `number`                                        | `0.5`                               | How fast the swells roll across the surface.                                               |
| `magnetism`         | `number`                                        | `1`                                 | Strength of the magnetic field that raises swells of spikes.                               |
| `variation`         | `number`                                        | `0`                                 | Picks a different arrangement of swells.                                                   |
| `flow-direction`    | `'down' \| 'up' \| 'left' \| 'right' \| 'none'` | `'down'`                            | Direction the swells roll. `none` keeps them morphing in place.                            |
| `mouse-interaction` | `boolean`                                       | `true`                              | Turns the cursor into a magnet that raises a crown of spikes.                              |
| `mouse-strength`    | `number`                                        | `1`                                 | Strength of the cursor magnet.                                                             |
| `mouse-radius`      | `number`                                        | `0.22`                              | Reach of the cursor magnet, as a fraction of the height.                                   |
| `mouse-dampening`   | `number`                                        | `0.15`                              | Seconds the crown takes to catch up with the cursor. 0 follows instantly.                  |
| `click-pulse`       | `boolean`                                       | `true`                              | Clicking sends a magnetic pulse through the fluid.                                         |
| `intro`             | `boolean`                                       | `true`                              | Raises the spikes when the field switches on.                                              |
| `light-mode`        | `boolean`                                       | `false`                             | Renders the fluid as glossy white liquid for light backgrounds.                            |
| `transparent`       | `boolean`                                       | `true`                              | Lets the page show through. When off, the fluid sits on `color`.                           |
| `color`             | `string`                                        | `'#120f17'`                         | Background color when `transparent` is off. Defaults to white in light mode.               |
| `opacity`           | `number`                                        | `1`                                 | Opacity of the whole effect.                                                               |
| `paused`            | `boolean`                                       | `false`                             | Freezes the fluid.                                                                         |
| `mix-blend-mode`    | `string`                                        | —                                   | CSS `mix-blend-mode` applied to the container.                                             |
| `dpr`               | `number`                                        | auto                                | Maximum device pixel ratio, capped at 2.                                                   |
| `class`             | `string`                                        | `''`                                | Extra classes for the container.                                                           |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the swells stop drifting, the intro and click pulse are skipped and the spikes settle at once.
- Rendering pauses while the component is off screen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/ferrofluid) by David Haz.
