---
title: Aero Shards
description: Silk ribbons of thick glass shards streaming on layered depths among survey markers, catching light along their edges.
---

Thousands of ray-traced glass shards stream along silk-like ribbons at five depths, soften with depth of field and glint with bloom. Move the cursor to part the shards and lean the camera, click to send a ring of light through every depth, or press and hold to gather nearby shards into a swirl that scatters on release.

::demo-aero-shards
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aero-shards.json"
```

## Usage

```vue
<script setup lang="ts">
  import AeroShards from '~/components/ui/aero-shards/AeroShards.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <AeroShards
      shard-color="#896ABD"
      accent-color="#A855F7"
      placement="full"
      material="glass"
      markers="plus"
      :count="1300"
      :depth-of-field="0.75"
      :glow="0.35"
    />
  </div>
</template>
```

AeroShards fills its parent, so give the parent a real height. It renders with WebGL2 and listens for `error` if the browser cannot create a context, so you can show a fallback. On light pages, set `light-mode` and use deeper shard colors (for example `#7c5cbf` and `#a855f7`).

## Props

| Prop                | Type                                      | Default         | Description                                                                                             |
| ------------------- | ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `shard-color`       | `string`                                  | `'#896ABD'`     | Main color of the shards.                                                                               |
| `accent-color`      | `string`                                  | `'#A855F7'`     | Color of the light the shards catch, their rim light and the markers.                                   |
| `background-color`  | `string`                                  | `'transparent'` | Fills the canvas behind the shards. Transparent lets the page show through.                             |
| `light-mode`        | `boolean`                                 | `false`         | Draws the shards as soft tinted glass for light backgrounds.                                            |
| `placement`         | `'full' \| 'left' \| 'right' \| 'center'` | `'full'`        | Where the ribbons flow: across the whole view, down one side, or in a ring around the center.           |
| `material`          | `'glass' \| 'chrome'`                     | `'glass'`       | Surface of the shards: thick glass that catches light along its edges, or polished chrome.              |
| `markers`           | `'plus' \| 'dots' \| 'none'`              | `'plus'`        | Survey markers floating at each depth. A few blink, and the one nearest the cursor gets a target frame. |
| `count`             | `number`                                  | `1300`          | Number of shards across all the ribbons.                                                                |
| `shard-size`        | `number`                                  | `1`             | Size of the shards.                                                                                     |
| `spread`            | `number`                                  | `1`             | Width of the ribbons.                                                                                   |
| `twist`             | `number`                                  | `1`             | How much the ribbons twist along their length.                                                          |
| `billow`            | `number`                                  | `1`             | How much the ribbons ripple like silk.                                                                  |
| `speed`             | `number`                                  | `1`             | How fast the shards flow.                                                                               |
| `scale`             | `number`                                  | `1`             | Zoom of the whole scene.                                                                                |
| `depth-of-field`    | `number`                                  | `0.75`          | How soft the farther ribbons get. 0 keeps everything sharp.                                             |
| `glow`              | `number`                                  | `0.35`          | Soft bloom around the brightest glints.                                                                 |
| `grain`             | `number`                                  | `0.06`          | Film grain on the shards. 0 turns it off.                                                               |
| `vignette`          | `number`                                  | `0.3`           | Fades everything out toward the edges of the frame. 0 runs edge to edge.                                |
| `intro`             | `boolean`                                 | `true`          | The ribbons draw in from the left, front to back, on mount.                                             |
| `mouse-interaction` | `boolean`                                 | `true`          | The cursor parts the shards it passes through and leans the camera toward it.                           |
| `mouse-strength`    | `number`                                  | `0.6`           | How strongly the cursor parts the shards.                                                               |
| `parallax`          | `number`                                  | `0.5`           | How far the camera leans toward the cursor.                                                             |
| `pulse-on-click`    | `boolean`                                 | `true`          | Clicking sends a ring of light out through every depth, flipping the shards it passes.                  |
| `hold-to-gather`    | `boolean`                                 | `true`          | Pressing and holding gathers nearby shards into a swirl that scatters back on release.                  |
| `paused`            | `boolean`                                 | `false`         | Freezes the flow.                                                                                       |
| `dpr`               | `number`                                  | `2`             | Maximum device pixel ratio of the canvas.                                                               |
| `class`             | `string`                                  | `''`            | Extra class names for the container.                                                                    |

## Events

| Event   | Payload | Description                                                                   |
| ------- | ------- | ----------------------------------------------------------------------------- |
| `error` | `Error` | Fires if WebGL2 is unavailable or a shader fails, so you can show a fallback. |

## Accessibility

- The canvas is decorative and carries `aria-hidden="true"`. Put real content in front of it.
- Pointer presses that start on links, buttons, inputs, labels or `role="button"` elements are ignored, so controls on top keep working.
- With `prefers-reduced-motion: reduce`, the flow, intro, cursor, click and hold effects all stop and the scene renders still.
- The render loop pauses when the canvas is offscreen, when the tab is hidden, and once a paused scene has settled.

- Ported from [React Bits](https://reactbits.dev/backgrounds/aero-shards) by David Haz.
