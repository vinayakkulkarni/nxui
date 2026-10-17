---
title: Drift Wall
description: An endless perspective wall of image tiles drifting past in alternating columns, lifting a tile toward you on hover.
---

An endless 3D wall of tiles. Columns drift up and down at slightly different speeds. Move the pointer to tilt the wall; hover or focus a tile to stop its column and lift the tile toward you.

::demo-drift-wall
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/drift-wall.json"
```

## Usage

```vue
<script setup lang="ts">
  import DriftWall from '~/components/ui/drift-wall/DriftWall.vue';
  import type { DriftWallItem } from '~/components/ui/drift-wall/types';

  const items: DriftWallItem[] = [1015, 1025, 1039, 1043, 1044, 1050].map(
    (id, i) => ({
      image: `https://picsum.photos/id/${id}/600/400`,
      title: `Tile ${i + 1}`,
      href: 'https://example.com',
    }),
  );
</script>

<template>
  <div class="relative h-150 w-full overflow-hidden">
    <DriftWall
      :items="items"
      :columns="5"
      :tilt="16"
      :turn="-14"
      :speed="42"
      direction="up"
      overlay-color="#060010"
    />
  </div>
</template>
```

The wall fills its parent, so give the parent a height.

## Props

| Prop             | Type              | Default       | Description                                                 |
| ---------------- | ----------------- | ------------- | ----------------------------------------------------------- |
| `items`          | `DriftWallItem[]` | 15 demo tiles | Tiles to display. Each item has `{ image, title?, href? }`. |
| `columns`        | `number`          | `5`           | Number of drifting columns.                                 |
| `tile-width`     | `number`          | `200`         | Width of each tile in pixels.                               |
| `tile-height`    | `number`          | `132`         | Height of each tile in pixels.                              |
| `gap`            | `number`          | `18`          | Spacing between tiles and columns in pixels.                |
| `radius`         | `number`          | `14`          | Corner radius of each tile in pixels.                       |
| `tilt`           | `number`          | `16`          | Perspective pitch of the wall (rotateX, degrees).           |
| `turn`           | `number`          | `-14`         | Perspective yaw of the wall (rotateY, degrees).             |
| `roll`           | `number`          | `0`           | In-plane rotation of the wall (rotateZ, degrees).           |
| `perspective`    | `number`          | `1200`        | Perspective distance in pixels. Smaller is more dramatic.   |
| `depth`          | `number`          | `120`         | How far the wall sits back from the viewer in pixels.       |
| `speed`          | `number`          | `42`          | Base drift speed in pixels per second.                      |
| `direction`      | `'up' \| 'down'`  | `'up'`        | Primary drift direction; columns alternate around it.       |
| `variance`       | `number`          | `0.45`        | How much column speeds differ from each other (0–1).        |
| `parallax`       | `number`          | `0.6`         | Pointer-follow tilt strength (0 disables it).               |
| `pause-on-hover` | `boolean`         | `false`       | Pause the whole wall while the pointer is over it.          |
| `lift`           | `number`          | `64`          | How far a hovered tile lifts toward the viewer in pixels.   |
| `fade`           | `number`          | `0.6`         | Strength of the edge and depth dissolve (0–1).              |
| `dim`            | `number`          | `0.55`        | Resting opacity of unhovered tiles (0–1).                   |
| `grayscale`      | `boolean`         | `false`       | Desaturate resting tiles; hover restores colour.            |
| `overlay-color`  | `string`          | `'#060010'`   | Tint laid over resting tiles, cleared on hover.             |

## Theming

Set these CSS custom properties on the component to fit a light page: `--dw-surface` (tile background, default `#0b0b12`), `--dw-overlay-opacity` (default `0.42`) and `--dw-ring` (focus ring colour). The demo uses `#f4f4f5`, `0.08` and a dark ring in light mode, together with a white overlay, `dim` 0.9 and `fade` 0.38.

## Accessibility

- Each tile is focusable. Tiles with an `href` are links that open in a new tab; others have `role="button"`.
- Focus lifts the tile, stops its column and shows a focus ring.
- With `prefers-reduced-motion: reduce` the columns stop drifting and the pointer tilt is off.

- Ported from [React Bits](https://reactbits.dev/components/drift-wall) by David Haz.
