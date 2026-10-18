---
title: Glass Surface
description: Apple-style liquid glass that bends what is behind it, in a rounded panel or any logo shape.
---

# Glass Surface

A liquid-glass panel that bends and splits the light behind its edges. In Chromium it uses an SVG displacement filter on `backdrop-filter`, so it bends anything behind it. In Safari and Firefox, pass the image, video or canvas behind it as `backdrop` and it refracts it with WebGL instead; without one it falls back to frosted glass. Give it a `shape` (an SVG or transparent PNG) and the glass takes that outline. In the demo, move the cursor to make the glass drift, drag it across the sky, and switch presets in the panel.

::demo-glass-surface
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glass-surface.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import GlassSurface from '~/components/ui/glass-surface/GlassSurface.vue';

  const sky = ref<HTMLImageElement | null>(null);
</script>

<template>
  <div class="relative flex h-125 items-center justify-center overflow-hidden">
    <img
      ref="sky"
      src="/sky.webp"
      alt=""
      crossorigin="anonymous"
      class="absolute inset-0 size-full object-cover"
    />
    <GlassSurface
      :width="320"
      :height="76"
      :border-radius="38"
      :displace="0.5"
      :background-opacity="0.1"
      :backdrop="sky"
    >
      <Icon name="lucide:house" class="size-6" />
    </GlassSurface>
  </div>
</template>
```

For a logo-shaped glass, pass `shape="/logo.svg"`. The image is fitted inside `width` × `height`, and its alpha channel becomes the outline and the bending edge.

## Props

| Prop                 | Type                                                        | Default        | Description                                                                                                                                    |
| -------------------- | ----------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`              | `number \| string`                                          | `200`          | Width in px, or any CSS value like `'100%'`.                                                                                                   |
| `height`             | `number \| string`                                          | `80`           | Height in px, or any CSS value like `'100vh'`.                                                                                                 |
| `border-radius`      | `number`                                                    | `20`           | Corner radius in px. Not used with a shape.                                                                                                    |
| `shape`              | `string`                                                    | —              | URL of an SVG or transparent PNG that gives the glass its outline. Files from another origin need CORS headers.                                |
| `refraction`         | `boolean`                                                   | `true`         | Bends what is behind the glass at its edges. `false` uses the frosted look everywhere.                                                         |
| `renderer`           | `'auto' \| 'svg' \| 'webgl'`                                | `'auto'`       | `auto` uses SVG filters in Chromium and WebGL in Safari/Firefox when a `backdrop` is given. `webgl` forces WebGL whenever a backdrop is given. |
| `backdrop`           | `HTMLImageElement \| HTMLVideoElement \| HTMLCanvasElement` | —              | The media behind the glass. WebGL can only bend what it is given. Cross-origin images need CORS headers.                                       |
| `distortion-scale`   | `number`                                                    | `-180`         | How strongly the edge bends what is behind it. Negative values pull the view inward.                                                           |
| `border-width`       | `number`                                                    | `0.07`         | Width of the bending edge, as a fraction of the shorter side.                                                                                  |
| `blur`               | `number`                                                    | `11`           | Softness of the transition from the bending edge to the calm center, in px.                                                                    |
| `brightness`         | `number`                                                    | `50`           | Brightness of the calm center, in %. `50` leaves it undistorted.                                                                               |
| `opacity`            | `number`                                                    | `0.93`         | How strongly the calm center holds the view still, from 0 to 1.                                                                                |
| `displace`           | `number`                                                    | `0`            | Blurs the light coming through the glass, for a frosted look.                                                                                  |
| `red-offset`         | `number`                                                    | `0`            | Extra bending for the red channel. Different offsets split light into colored fringes.                                                         |
| `green-offset`       | `number`                                                    | `10`           | Extra bending for the green channel.                                                                                                           |
| `blue-offset`        | `number`                                                    | `20`           | Extra bending for the blue channel.                                                                                                            |
| `background-opacity` | `number`                                                    | `0`            | Opacity of a soft frosted tint over the glass, from 0 to 1.                                                                                    |
| `saturation`         | `number`                                                    | `1`            | Saturation of what is seen through the glass.                                                                                                  |
| `x-channel`          | `'R' \| 'G' \| 'B' \| 'A'`                                  | `'R'`          | Channel of the displacement map that moves pixels sideways.                                                                                    |
| `y-channel`          | `'R' \| 'G' \| 'B' \| 'A'`                                  | `'G'`          | Channel of the displacement map that moves pixels up and down.                                                                                 |
| `mix-blend-mode`     | `GlassSurfaceBlendMode`                                     | `'difference'` | How the two edge gradients of the displacement map are combined.                                                                               |
| `class`              | `string`                                                    | —              | Extra classes for the glass.                                                                                                                   |

## Slots

| Slot      | Description                 |
| --------- | --------------------------- |
| `default` | Content shown on the glass. |

## Accessibility

- The filter SVG, WebGL canvas and outline layers are `aria-hidden`; only the slot content is exposed.
- The glass is decorative; put real buttons or links inside it for interaction.
- The WebGL renderer pauses while the glass is offscreen or the tab is hidden, and only redraws when the glass, the backdrop or a prop changes.

- Ported from [React Bits](https://reactbits.dev/components/glass-surface) by David Haz.
