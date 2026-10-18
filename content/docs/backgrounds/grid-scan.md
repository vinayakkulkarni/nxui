---
title: Grid Scan
description: A 3D grid room swept by a scanning light that follows your view.
---

A lit 3D room drawn with one raw WebGL2 shader: crisp grid lines, soft corner shading, a glossy floor that reflects the light and points that sparkle as the scan passes. A first scan reveals the room on mount, then scans repeat on a loop. Move the cursor and the view shifts like a window while the walls under it light up; click to send a ping across the walls. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-grid-scan
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grid-scan.json"
```

## Usage

```vue
<script setup lang="ts">
  import GridScan from '~/components/ui/grid-scan/GridScan.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <GridScan
      lines-color="#4d4757"
      scan-color="#7dd3fc"
      :cells="8"
      :depth="3"
      scan-direction="forward"
      click-effect="ping"
    />
  </div>
</template>
```

The demo presets ship with the component: `gridScanPreset('laser', isLight)` returns the look of the Scan, Laser, LiDAR, Blueprint, Deep, Wire or Pulse preset, with its light-mode colors when the second argument is `true`.

## Props

| Prop             | Type                                    | Default     | Description                                                                          |
| ---------------- | --------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `lines-color`    | `string`                                | `'#4d4757'` | Color of the grid lines. Light mode defaults to `'#d4d4d8'`.                         |
| `scan-color`     | `string`                                | `'#7dd3fc'` | Color of the scan, trail, points and ping. Light mode defaults to `'#0284c7'`.       |
| `cells`          | `number`                                | `8`         | Number of grid cells from the floor to the ceiling (2–40).                           |
| `line-thickness` | `number`                                | `1`         | Thickness of the grid lines in pixels (0.5–4).                                       |
| `line-style`     | `'solid' \| 'dashed' \| 'dotted'`       | `'solid'`   | Style of the grid lines.                                                             |
| `depth`          | `number`                                | `3`         | How deep the room goes, relative to its height. High values make a long corridor.    |
| `depth-fade`     | `number`                                | `0.6`       | How much the room fades into the distance, from 0 (even) to 1 (gone at the back).    |
| `parallax`       | `number`                                | `1`         | How far the view shifts as the cursor moves, like a head in front of a window.       |
| `shading`        | `number`                                | `0.7`       | Soft light and corner shadows on the walls, from 0 (pure wireframe) to 1.            |
| `reflection`     | `number`                                | `0.35`      | How much the glossy floor reflects the scan and pings, from 0 to 1.                  |
| `points`         | `boolean`                               | `true`      | Scatters points over the walls that sparkle as the scan passes, like a LiDAR scan.   |
| `scan-direction` | `'forward' \| 'backward' \| 'pingpong'` | `'forward'` | Whether the scan travels into the room, out of it, or alternates.                    |
| `scan-duration`  | `number`                                | `2.4`       | Seconds each scan takes to cross the room.                                           |
| `scan-delay`     | `number`                                | `1.6`       | Seconds between scans.                                                               |
| `scan-width`     | `number`                                | `1`         | Thickness of the scan line, from 0.2 to 5.                                           |
| `trail`          | `number`                                | `0.5`       | How long the walls keep glowing behind the scan, from 0 to 1.                        |
| `glow`           | `number`                                | `0.6`       | Bloom around the scan line and points, from 0 to 1.5.                                |
| `auto-scan`      | `boolean`                               | `true`      | Runs scans on a loop. Turn it off to scan only on click.                             |
| `interactive`    | `boolean`                               | `true`      | Moves the view with the cursor and lights up the walls under it.                     |
| `click-effect`   | `'ping' \| 'scan' \| 'none'`            | `'ping'`    | What a click does: a ring of light across the walls, a new scan, or nothing.         |
| `enable-webcam`  | `boolean`                               | `false`     | Moves the view with your head through the webcam. face-api.js loads from a CDN.      |
| `show-preview`   | `boolean`                               | `false`     | Shows a small camera preview with the tracking status while the webcam is on.        |
| `models-path`    | `string`                                | CDN URL     | Where the face tracking model loads from. Point it at your own copy to self-host.    |
| `enable-gyro`    | `boolean`                               | `false`     | Moves the view as a phone or tablet tilts. iOS asks for permission on the first tap. |
| `intro`          | `boolean`                               | `true`      | Reveals the room with a first scan on mount.                                         |
| `light-mode`     | `boolean`                               | `false`     | Renders a bright room with dark shading for light backgrounds.                       |
| `dpr`            | `number`                                | auto        | Maximum device pixel ratio, capped at 2.                                             |
| `class`          | `string`                                | `''`        | Extra classes merged on the container.                                               |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer and click listeners are passive and sit on `window`, so the room never steals focus or clicks from your UI.
- With `prefers-reduced-motion: reduce` there is no intro, no automatic scan, no drift and no click effect. The room is drawn once and holds still.
- The webcam only turns on when `enable-webcam` is set. The camera preview reports its state through a `role="status"` label.
- The render loop stops when the room is idle, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/grid-scan) by David Haz.
