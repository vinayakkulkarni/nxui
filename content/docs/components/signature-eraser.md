---
title: Signature Eraser
description: A signing canvas whose ink disintegrates into physics particles when cleared.
---

::demo-signature-eraser
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/signature-eraser.json"
```

## Usage

```vue
<script setup lang="ts">
  import SignatureEraser from '~/components/ui/signature-eraser/SignatureEraser.vue';
</script>

<template>
  <SignatureEraser class="h-100" />
</template>
```

The component renders a default cursive signature on a canvas. Draw over it
with the **pen**, wipe portions away with the **eraser**, or press **Clear**
to spawn a particle for every sampled ink point and run the active physics
effect. The effect label cycles through five modes:

- **Thanos Snap** — particles drift, scatter and fade in place.
- **Black Hole** — particles orbit and spiral into the canvas center.
- **Explosion** — particles burst outward from the center with gravity.
- **Wind Sweep** — particles are swept laterally into a trailing cloud.
- **Rewind** — particles fly back to their origin and rebuild the signature.

Ink sampling respects `prefers-reduced-motion`: with reduced motion enabled,
Clear wipes the canvas instantly instead of running the particle physics.
The canvas resizes to its container and re-rasterizes ink on resize, so give
it a real height (`h-100`, `size-full` in a sized parent, etc.).

## Props

| Prop                 | Type                      | Default          | Description                                             |
| -------------------- | ------------------------- | ---------------- | ------------------------------------------------------- |
| `signature`          | `SignatureEraserStroke[]` | built-in cursive | Strokes rendered as the initial signature               |
| `effect`             | `SignatureEraserEffect`   | `'thanos-snap'`  | Particle effect used when the signature is cleared      |
| `pen-width`          | `number`                  | `3`              | Pen stroke width in CSS pixels                          |
| `eraser-radius`      | `number`                  | `18`             | Eraser radius in CSS pixels                             |
| `particle-density`   | `number`                  | `1`              | Particle count multiplier (`1` = one per sampled point) |
| `auto-restore`       | `boolean`                 | `true`           | Restore the signature after an erase effect finishes    |
| `auto-restore-delay` | `number`                  | `2600`           | Delay before auto-restore in milliseconds               |

`SignatureEraserEffect` is one of `'thanos-snap'`, `'black-hole'`,
`'explosion'`, `'wind-sweep'`, or `'rewind'`.

## Events

| Event      | Payload                 | Description                         |
| ---------- | ----------------------- | ----------------------------------- |
| `cleared`  | `SignatureEraserEffect` | Fired when Clear runs an effect     |
| `restored` | —                       | Fired when the signature is rebuilt |
| `change`   | `number`                | Stroke count after a new pen stroke |

## Credits

Inspired by a physics-based signature eraser interaction shared in the Vue
community.
