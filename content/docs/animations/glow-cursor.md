---
title: Glow Cursor
description: Light that pours from the cursor, drifts softly through the air and cools as it fades, with a burst on click.
---

A WebGL fluid simulation that pours light from the cursor. Move the pointer over the area to draw a trail that starts white-hot at the head, then drifts, curls and cools to a second color as it fades. Click to release a burst of light. Set `theme="light"` on light backgrounds for an ink-like look.

::demo-glow-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glow-cursor.json"
```

## Usage

```vue
<script setup lang="ts">
  import GlowCursor from '~/components/ui/glow-cursor/GlowCursor.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <GlowCursor
      color="#5f8bff"
      :trail-width="3"
      :linger="1.4"
      :glow="1.2"
      :hotspot="0.8"
      :follow-speed="0.6"
      :click-burst="true"
      quality="high"
      theme="dark"
    />
  </div>
</template>
```

## Props

| Prop                     | Type                          | Default     | Description                                                                              |
| ------------------------ | ----------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `color`                  | `string`                      | `'#5f8bff'` | Color of the light where it is freshly drawn                                             |
| `secondary-color`        | `string`                      | `''`        | Color the light cools to as it drifts. Leave it out for a deeper shade of the main color |
| `intensity`              | `number`                      | `1.3`       | Brightness of the light                                                                  |
| `trail-width`            | `number`                      | `3`         | Thickness of the light where it is drawn, in pixels                                      |
| `linger`                 | `number`                      | `1.4`       | Seconds the light stays visible before it fades                                          |
| `glow`                   | `number`                      | `1.2`       | Strength of the soft glow around the light                                               |
| `hotspot`                | `number`                      | `0.8`       | Strength of the white-hot core near the cursor                                           |
| `follow-speed`           | `number`                      | `0.6`       | How tightly the light follows the cursor, from 0 to 1                                    |
| `grain`                  | `number`                      | `0`         | Amount of film grain in the light                                                        |
| `click-burst`            | `boolean`                     | `true`      | Releases a burst of light when you click                                                 |
| `quality`                | `'low' \| 'medium' \| 'high'` | `'high'`    | Resolution of the simulation. Lower it for weaker devices                                |
| `theme`                  | `'dark' \| 'light'`           | `'dark'`    | Use light on light backgrounds for an ink-like look                                      |
| `blend-mode`             | `string`                      | `auto`      | CSS blend mode of the canvas. Defaults to screen in dark and normal in light             |
| `max-device-pixel-ratio` | `number`                      | `2`         | Maximum pixel density of the canvas                                                      |
| `enabled`                | `boolean`                     | `true`      | Stops drawing new light while keeping what is already there                              |
| `class`                  | `string`                      | `''`        | Extra class names for the root element                                                   |

## Slots

| Slot      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `default` | Content rendered above the light. The canvas never takes clicks |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Add a visible caption or an `aria-label` on a parent if the glow carries meaning.
- With `prefers-reduced-motion: reduce` the light no longer flows: the trail snaps to the cursor and only fades in place.
- The render loop stops while the component is offscreen or idle, and the WebGL context is released on unmount.
- Needs WebGL 2 with `EXT_color_buffer_float`. Without it the component renders only its slot content.
- Ported from [React Bits](https://reactbits.dev/animations/glow-cursor) by David Haz.
