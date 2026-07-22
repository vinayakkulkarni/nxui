---
title: Holo Cloth
description: A grabbable sheet of simulated cloth draped in an iridescent holo-foil material, floating in zero gravity.
---

::demo-holo-cloth
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/holo-cloth.json"
```

## Usage

```vue
<script setup lang="ts">
  import HoloCloth from '~/components/ui/holo-cloth/HoloCloth.vue';
</script>

<template>
  <HoloCloth preset="holo" class="h-120" />
</template>
```

Click and drag the fabric to pull it — the cloth wrinkles, settles, and floats
like it's suspended in gel (Verlet integration with structural, shear, and
bend constraints; no physics library). Drag empty space to orbit. The holo
preset renders an iridescent foil with rainbow diffraction, angle-gated
sparkle, a woven normal map, and fold occlusion; `chrome` and `black-cloth`
swap the material bundle. Pass `image` to drape a graphic over the fabric —
it deforms with the cloth.

```vue
<template>
  <HoloCloth
    preset="chrome"
    image="/poster.png"
    background="transparent"
    class="h-120"
  />
</template>
```

The component also exposes `poke()` (random gentle impulse) and `reset()`
(back to the draped rest pose) via a template ref.

## Props

| Prop          | Type                                  | Default     | Description                                       |
| ------------- | ------------------------------------- | ----------- | ------------------------------------------------- |
| `preset`      | `'holo' \| 'chrome' \| 'black-cloth'` | `'holo'`    | Material preset                                   |
| `image`       | `string`                              | `''`        | Image URL draped onto the cloth (deforms with it) |
| `background`  | `string`                              | `'#0b0c12'` | Scene background; `'transparent'` clears it       |
| `interactive` | `boolean`                             | `true`      | Enable cloth grabbing and camera orbit            |
| `zoom`        | `boolean`                             | `false`     | Allow scroll-wheel zoom                           |
| `quality`     | `'high' \| 'medium' \| 'low'`         | `'high'`    | Render scale / MSAA / cloth resolution trade-off  |

## Credits

Ported from [Holocloth](https://github.com/dmitrykurash/holocloth) by
[Dmitry Kurash](https://x.com/DmitryKurash) — real-time holographic cloth
with hand-written Verlet physics and GLSL foil shading.
