---
title: Depth Text
description: Layered extruded type with parallax that shifts against the pointer.
---

# Depth Text

Big display type built from a stack of copies pushed back in 3D, so the word reads as a solid block. The block tilts toward the pointer with smoothed parallax and drifts in a slow orbit when the pointer is idle. Hover to press it into the page; press to push deeper and let go to bounce back. Try the extrude, fade, float and contour presets in the panel.

::demo-depth-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/depth-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import DepthText from '~/components/ui/depth-text/DepthText.vue';
</script>

<template>
  <DepthText
    text="Elevate"
    depth-color="#ff5a1f"
    gradient-depth
    :layers="56"
    :depth="2.6"
    :tilt="10"
    :hover-push="0.65"
  />
</template>
```

## Props

| Prop               | Type               | Default                     | Description                                                                                              |
| ------------------ | ------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `text`             | `string`           | `'Elevate'`                 | The word or short phrase rendered as extruded type.                                                      |
| `layers`           | `number`           | `34`                        | Number of stacked copies that form the extrusion. Clamped to 2–64 to protect the DOM.                    |
| `depth`            | `number`           | `2.4`                       | Spacing in pixels between each layer.                                                                    |
| `face-color`       | `string`           | `'currentColor'`            | Color of the front face. Follows the surrounding text color by default.                                  |
| `depth-color`      | `string`           | `'#7c3aed'`                 | Tint the extrusion fades into toward the back.                                                           |
| `gradient-depth`   | `boolean`          | `false`                     | Paint the extrusion in the depth color right behind the face and fade it out toward the back.            |
| `tilt`             | `number`           | `7.5`                       | Resting angle and maximum pointer-driven rotation, in degrees.                                           |
| `pointer-tracking` | `boolean`          | `true`                      | Smoothed pointer parallax on fine pointer devices.                                                       |
| `smoothing`        | `number`           | `0.14`                      | Damping used to ease rotation toward the pointer target.                                                 |
| `perspective`      | `number`           | `900`                       | Perspective distance in pixels for the 3D stack.                                                         |
| `auto-orbit`       | `boolean`          | `true`                      | A subtle orbit when pointer tracking is unavailable or idle.                                             |
| `orbit-speed`      | `number`           | `0.35`                      | Speed of the orbit in cycles per second.                                                                 |
| `hover-push`       | `number`           | `0`                         | How far hovering presses the text into the page, 0 to 1. The extrusion compresses on a spring. 0 is off. |
| `float`            | `boolean`          | `false`                     | Let the text bob and sway gently while it is not hovered.                                                |
| `font-size`        | `string`           | `'clamp(3rem, 12vw, 7rem)'` | CSS font-size value for the word.                                                                        |
| `font-weight`      | `number \| string` | `900`                       | Font weight used for every layer.                                                                        |
| `shadow`           | `boolean`          | `true`                      | Cast a soft drop shadow behind the extrusion.                                                            |
| `outline`          | `boolean`          | `false`                     | Draw the extrusion as stacked outlines instead of solid layers.                                          |
| `intro`            | `boolean`          | `true`                      | Grow the extrusion out from the flat face on mount.                                                      |
| `class`            | `string`           | `''`                        | Extra classes for the root element.                                                                      |

## Accessibility

- Only the front face is exposed to screen readers. The extrusion layers are `aria-hidden`.
- With reduced motion, the word rests at its base angle with full depth: no orbit, parallax, float or push.
- The animation loop stops while the text is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/depth-text) by David Haz.
