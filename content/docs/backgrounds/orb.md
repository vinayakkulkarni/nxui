---
title: Orb
description: A glowing ring of swirling color that breathes, trails an orbiting light and reaches toward the cursor.
---

A glowing ring of swirling color drawn in one raw WebGL2 pass. It powers on with a spring and a swirl, then breathes while a light orbits it. Move the cursor close and the ring reaches toward you, lights up on that side and the orbiting light swings to meet you. Click the orb to make it pulse and send out an echo ring.

::demo-orb
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orb.json"
```

## Usage

```vue
<script setup lang="ts">
  import Orb from '~/components/ui/orb/Orb.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <Orb
      :colors="['#9c43fe', '#4cc2e9', '#101499']"
      :hover-intensity="1"
      :tilt-x="0"
      rotate-on-hover
      follow-cursor
      click-pulse
    />
  </div>
</template>
```

The canvas is transparent. Set `background-color` to the color of the page behind it: a light color switches the orb to a soft, filled style that reads on white.

## Props

| Prop                | Type       | Default                             | Description                                                                            |
| ------------------- | ---------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `colors`            | `string[]` | `['#9c43fe', '#4cc2e9', '#101499']` | Two colors that swirl around the ring, then the deep color of the glow. Any CSS color. |
| `hue`               | `number`   | `0`                                 | Shifts the hue of every color, in degrees.                                             |
| `background-color`  | `string`   | `'#000000'`                         | Color the orb sits on. Light colors switch it to a soft, filled style.                 |
| `size`              | `number`   | `1`                                 | Size of the orb relative to the container.                                             |
| `glow`              | `number`   | `1`                                 | How soft and wide the glow around the ring is.                                         |
| `bleed`             | `number`   | `1`                                 | How far the glow bleeds into the inside of the orb. 0 keeps a tight ring.              |
| `wobble`            | `number`   | `1`                                 | How much the ring breathes and warps at rest.                                          |
| `highlight`         | `number`   | `1`                                 | Brightness of the light that orbits the ring.                                          |
| `trail`             | `number`   | `1`                                 | Length of the glowing tail behind the orbiting light. 0 removes it.                    |
| `tilt-x`            | `number`   | `0`                                 | Tilts the ring back in perspective, in degrees. Positive pushes the top away.          |
| `tilt-y`            | `number`   | `0`                                 | Turns the ring sideways in perspective, in degrees.                                    |
| `speed`             | `number`   | `1`                                 | Speed of the swirl, the orbiting light and the breathing.                              |
| `hover-intensity`   | `number`   | `1`                                 | How far the ring reaches toward the cursor and how brightly it lights up.              |
| `rotate-on-hover`   | `boolean`  | `true`                              | Slowly turns the orb while it is hovered.                                              |
| `force-hover-state` | `boolean`  | `false`                             | Keeps the hover effect on without hovering.                                            |
| `follow-cursor`     | `boolean`  | `true`                              | The orbiting light swings toward the cursor while the orb is hovered.                  |
| `click-pulse`       | `boolean`  | `true`                              | Clicking the orb makes it pulse and swirl.                                             |
| `intro`             | `boolean`  | `true`                              | Powers the orb on with a spring and a swirl.                                           |
| `opacity`           | `number`   | `1`                                 | Opacity of the whole effect.                                                           |
| `paused`            | `boolean`  | `false`                             | Freezes the animation.                                                                 |
| `dpr`               | `number`   | auto                                | Maximum device pixel ratio, capped at 2.                                               |
| `class`             | `string`   | `''`                                | Extra classes for the container.                                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the orb renders a still ring: no intro, no swirl, no reach toward the cursor and no click pulse.
- Pointer tracking is passive and never blocks scrolling or clicks on content above the orb.
- Animation stops when the orb is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/orb) by David Haz.
