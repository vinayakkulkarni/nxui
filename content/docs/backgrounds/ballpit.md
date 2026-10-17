---
title: Ballpit
description: A soft-lit pit of physics balls you can shove with the cursor, grab, throw and blast apart.
---

Hundreds of ray-traced balls settle into a pit with real contact physics. Move the pointer to push them aside with a lit cursor ball, press on a ball to grab and throw it, or click an empty spot to blast the balls nearby away with a flash of light.

::demo-ballpit
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ballpit.json"
```

## Usage

```vue
<script setup lang="ts">
  import Ballpit from '~/components/ui/ballpit/Ballpit.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Ballpit
      :count="200"
      :colors="['#ffffff', '#5227ff']"
      material="gloss"
      :gravity="0.5"
      click-effect="burst"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. It renders with raw WebGL2: each ball is a single quad that is ray-traced in the fragment shader, so thousands of balls stay smooth. The animation loop sleeps once the balls come to rest and wakes on input or prop changes.

## Props

| Prop              | Type                                                    | Default       | Description                                                                                  |
| ----------------- | ------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `count`           | `number`                                                | `200`         | Number of balls in the pit (1–4000).                                                         |
| `colors`          | `(string \| number)[]`                                  | `['#ffffff']` | Ball colors, handed out in turn. Hex strings or numbers such as `0x5227ff`.                  |
| `material`        | `'satin' \| 'matte' \| 'gloss' \| 'frosted' \| 'metal'` | `'satin'`     | Surface finish: soft satin, chalky matte, polished gloss, see-through frosted or metal.      |
| `min-size`        | `number`                                                | `0.5`         | Smallest ball radius. The view is about 18 units tall.                                       |
| `max-size`        | `number`                                                | `1`           | Largest ball radius.                                                                         |
| `gravity`         | `number`                                                | `0.5`         | Pull toward the floor. `0` lets the balls float, around `0.5` piles them up.                 |
| `friction`        | `number`                                                | `0.9975`      | How much speed the balls keep each frame. `1` never slows them down.                         |
| `wall-bounce`     | `number`                                                | `0.95`        | How much speed the balls keep when they hit the edges, from 0 to 1.                          |
| `bounce`          | `number`                                                | `0.85`        | How bouncy the balls are against each other, from 0 to 1.                                    |
| `depth`           | `number`                                                | `2`           | How deep the pit is, so balls can sit in front of and behind each other.                     |
| `drift`           | `number`                                                | `0`           | Gentle wandering that keeps floating balls moving on their own.                              |
| `follow-cursor`   | `boolean`                                               | `true`        | A ball follows the cursor and shoves the others out of the way.                              |
| `cursor-size`     | `number`                                                | `1`           | Radius of the cursor ball.                                                                   |
| `grab`            | `boolean`                                               | `true`        | Press on a ball to pick it up, drag it around and throw it.                                  |
| `click-effect`    | `'burst' \| 'none'`                                     | `'burst'`     | Clicking an empty spot blasts the nearby balls away with a flash of light.                   |
| `light-color`     | `string`                                                | `'#ffffff'`   | Color of the light that follows the cursor and lights up the balls around it.                |
| `light-intensity` | `number`                                                | `1`           | Brightness of the cursor light.                                                              |
| `exposure`        | `number`                                                | `1`           | Overall brightness of the balls.                                                             |
| `shadows`         | `number`                                                | `0.6`         | Strength of the soft shadows where balls touch each other and the floor.                     |
| `intro`           | `boolean`                                               | `true`        | Balls pour in from the top on mount, or burst out from the center when gravity is near zero. |
| `dpr`             | `number`                                                | auto          | Maximum device pixel ratio, capped at 2.                                                     |
| `class`           | `string`                                                | `''`          | Extra classes for the container.                                                             |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Put real content above it.
- Pointer input is read on the window, so content layered over the pit still gets its own clicks: presses on links, buttons, inputs and labels never grab a ball or trigger a burst.
- With `prefers-reduced-motion: reduce`, the intro, drift and click burst are turned off and balls start at rest.
- The loop pauses when the pit is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/ballpit) by David Haz.
