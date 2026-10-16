---
title: Warp Text
description: WebGL glass warp that bends and refracts a headline around the pointer, with click shockwaves and an idle lens that drifts across the words.
---

# Warp Text

The text is drawn into a texture and rendered through a WebGL glass shader. Slow noise keeps the letters gently undulating. Move the cursor over the text to bend it with a lens that bulges, pinches or swirls, with optional color fringing. Click to send a shockwave ring through the letters. When the cursor leaves, the lens keeps wandering over the words. On mount, the text fades in from a strong warp and settles.

::demo-warp-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/warp-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import WarpText from '~/components/ui/warp-text/WarpText.vue';
</script>

<template>
  <div class="relative h-112 w-full overflow-hidden rounded-3xl">
    <WarpText
      text="Bend the moment"
      lens="swirl"
      :pointer-strength="0.5"
      :chromatic="0.35"
      class="absolute inset-0 size-full"
    />
  </div>
</template>
```

The component fills its container, so give the parent a real height. The text color follows `currentColor` by default and re-rasterises when the inherited color changes, so it follows light and dark mode.

## Props

| Prop                | Type                            | Default                     | Description                                                                               |
| ------------------- | ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| `text`              | `string`                        | `'Bend the moment'`         | The headline drawn into the WebGL texture. Use `\n` for line breaks.                      |
| `color`             | `string`                        | `'currentColor'`            | Text fill before the glass pass. Follows the surrounding text color by default.           |
| `warp-strength`     | `number`                        | `0.08`                      | Amount of ambient glass distortion at rest.                                               |
| `warp-scale`        | `number`                        | `1.7`                       | Size of the moving distortion cells.                                                      |
| `speed`             | `number`                        | `0.55`                      | Speed of the ambient undulation.                                                          |
| `lens`              | `'bulge' \| 'pinch' \| 'swirl'` | `'bulge'`                   | How the cursor bends the text: magnify it, pull it inward or twist it around the pointer. |
| `pointer-influence` | `number`                        | `0.42`                      | Radius of the cursor lens.                                                                |
| `pointer-strength`  | `number`                        | `0.38`                      | Strength of cursor-driven bending and magnification.                                      |
| `idle-drift`        | `number`                        | `0.2`                       | How strongly the lens keeps wandering while the cursor is away, from `0` (fades) to `1`.  |
| `chromatic`         | `number`                        | `0`                         | Color fringing inside the lens and click ripples. `0` is off, `1` is strong.              |
| `refraction`        | `number`                        | `0.018`                     | Subtle RGB channel split for the glass edge.                                              |
| `ripple`            | `boolean`                       | `true`                      | Adds a soft ripple to the pointer lens.                                                   |
| `click-ripple`      | `boolean`                       | `true`                      | Clicking sends a shockwave ring through the text that bends the letters as it passes.     |
| `intro`             | `boolean`                       | `true`                      | Fades the text in from a strong warp that settles.                                        |
| `font-size`         | `string \| number`              | `'clamp(3rem, 10vw, 9rem)'` | Raster font size. Numbers are pixels. The text shrinks to fit the container.              |
| `font-weight`       | `string \| number`              | `800`                       | Font weight used when rasterising the text.                                               |
| `font-family`       | `string`                        | `'inherit'`                 | Font family used when rasterising the text.                                               |
| `letter-spacing`    | `string \| number`              | `'-0.06em'`                 | Tracking applied while drawing the text. Numbers are pixels.                              |
| `line-height`       | `string \| number`              | `0.9`                       | Line height for multi-line text.                                                          |
| `class`             | `string`                        | `''`                        | Extra classes for the root.                                                               |

## Accessibility

- The root has `role="img"` and an `aria-label` with the text. The canvas is `aria-hidden`.
- With `prefers-reduced-motion`, the intro and ambient undulation are off, the lens runs at 35% strength and click ripples are softer.
- If WebGL is unavailable or the context is lost, the text renders as plain styled HTML.
- The render loop pauses when the component is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/text-animations/warp-text) by David Haz.
