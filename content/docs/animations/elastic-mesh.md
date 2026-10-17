---
title: Elastic Mesh
description: Turns text or any logo into a puffy inflated WebGL2 shape you can press, poke and stretch like jelly.
---

Text or a logo is inflated into a soft 3D surface lit by a studio environment. Hover to dent it, tap to poke it, and drag to pull it — it stretches, then snaps back with a jiggle. The surface tilts toward the cursor and each letter pops in on mount.

::demo-elastic-mesh
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/elastic-mesh.json"
```

## Usage

```vue
<script setup lang="ts">
  import ElasticMesh from '~/components/ui/elastic-mesh/ElasticMesh.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <ElasticMesh
      text="Squish"
      material="jelly"
      color="#ff5a1f"
      :stiffness="0.35"
      :wobble="0.85"
      :grab-radius="70"
      theme="dark"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. Pass `src` with an SVG or PNG URL to inflate a logo instead of text; its transparent pixels define the shape.

## Props

| Prop           | Type                                         | Default                   | Description                                                             |
| -------------- | -------------------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `text`         | `string`                                     | `'Squish'`                | Text to inflate. Use `\n` for more lines.                               |
| `src`          | `string`                                     | `''`                      | URL of an SVG or PNG to inflate instead of text.                        |
| `font-family`  | `string`                                     | `'system-ui, sans-serif'` | Font used for the text. Heavy, rounded faces inflate best.              |
| `font-weight`  | `number \| string`                           | `900`                     | Weight of the text.                                                     |
| `color`        | `string`                                     | `'#3b5bff'`               | Base color of the material.                                             |
| `image-colors` | `boolean`                                    | `true`                    | Keeps the colors of the image passed to `src` instead of using `color`. |
| `material`     | `'balloon' \| 'chrome' \| 'jelly' \| 'clay'` | `'balloon'`               | Glossy balloon, mirror chrome, glowing jelly or soft matte clay.        |
| `inflate`      | `number`                                     | `1`                       | How puffy the shape is. 1 gives round tubes.                            |
| `stiffness`    | `number`                                     | `0.5`                     | 0 is soft and stretchy, 1 is firm and quick.                            |
| `wobble`       | `number`                                     | `0.6`                     | How long it jiggles after a poke or a pull, from 0 to 1.                |
| `grab-radius`  | `number`                                     | `70`                      | Size of the area the cursor grabs and presses, in pixels.               |
| `stretch`      | `number`                                     | `0.5`                     | How far the material can be pulled, from 0 to 1.                        |
| `press`        | `number`                                     | `0.5`                     | Depth of the dent under the cursor and of a poke.                       |
| `shadow`       | `number`                                     | `0.5`                     | Strength of the soft drop shadow.                                       |
| `intro`        | `boolean`                                    | `true`                    | Inflates the shape letter by letter on mount.                           |
| `theme`        | `'dark' \| 'light'`                          | `'dark'`                  | Lighting setup for dark or light pages.                                 |
| `dpr`          | `number`                                     | auto                      | Maximum device pixel ratio, capped at 2.                                |
| `class`        | `string`                                     | `''`                      | Extra classes merged onto the container.                                |

## Accessibility

- The container is `role="img"` with the text (or "Elastic logo") as its label.
- It is focusable: press <kbd>Enter</kbd> or <kbd>Space</kbd> to poke the next letter, with a visible focus ring.
- With `prefers-reduced-motion: reduce`, the intro and cursor tilt are skipped and the springs are heavily damped.
- Rendering pauses while the component is offscreen or the tab is hidden, and stops once the surface settles.

- Ported from [React Bits](https://reactbits.dev/animations/elastic-mesh) by David Haz.
