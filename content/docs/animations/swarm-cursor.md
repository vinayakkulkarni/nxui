---
title: Swarm Cursor
description: A liquid swarm of particles that flows after the cursor, curls into eddies and pours around hovered buttons.
---

A WebGL2 particle swarm that rides a small fluid simulation. It flows after the cursor, curls into eddies when the cursor rests, pours around hovered links and buttons, and splashes when you click. Move the pointer over the demo, rest it, hover a button, then click.

::demo-swarm-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/swarm-cursor.json"
```

## Usage

```vue
<script setup lang="ts">
  import SwarmCursor from '~/components/ui/swarm-cursor/SwarmCursor.vue';
</script>

<template>
  <div class="relative h-130 w-full overflow-hidden bg-zinc-950">
    <SwarmCursor
      :count="800"
      :size="2.6"
      shape="dot"
      color="#ffffff"
      :spread="90"
      :swirl="0.6"
      :tail="0.5"
      idle="roam"
      click-effect="burst"
    >
      <div class="flex size-full flex-col items-center justify-center gap-6">
        <h1 class="text-4xl font-semibold text-white">
          Teams move faster in formation
        </h1>
        <button type="button">Start for free</button>
      </div>
    </SwarmCursor>
  </div>
</template>
```

The swarm fills its container and draws behind the default slot. Give the container a size, put your hero or buttons in the slot, and the particles pour around any element that matches `targets` while it is hovered. Add `data-swarm-target` to any other element you want the swarm to wrap.

## Props

| Prop           | Type                            | Default                            | Description                                                                                                   |
| -------------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `count`        | `number`                        | `800`                              | Number of particles in the swarm, up to 2000.                                                                 |
| `size`         | `number`                        | `2.6`                              | Size of each particle, in px.                                                                                 |
| `shape`        | `'dot' \| 'streak' \| 'square'` | `'dot'`                            | Shape of each particle.                                                                                       |
| `color`        | `string`                        | `'#ffffff'`                        | Color of the particles. Defaults to near black in light mode.                                                 |
| `accent-color` | `string`                        | `color`                            | Color particles take on when they rush and when you click.                                                    |
| `spread`       | `number`                        | `90`                               | Radius of the swarm around the cursor, in px.                                                                 |
| `speed`        | `number`                        | `1`                                | How lively the swarm churns and turns while the cursor rests.                                                 |
| `swirl`        | `number`                        | `0.6`                              | How much the swarm curls into eddies and how long they keep turning, from 0 (calm) to 1 (stormy).             |
| `tail`         | `number`                        | `0.5`                              | How far the swarm streams behind a fast cursor, from 0 (tight) to 1 (a long trailing tail).                   |
| `trail`        | `number`                        | `0.6`                              | Motion blur on fast particles.                                                                                |
| `wander`       | `number`                        | `0.5`                              | How restlessly the swarm folds and drifts on its own.                                                         |
| `depth`        | `number`                        | `0.7`                              | How much near particles grow and blur and far ones shrink and fade, from 0 (flat) to 1 (deep).                |
| `targets`      | `string`                        | `'a, button, [data-swarm-target]'` | Elements inside the swarm that it pours around while hovered. Pass an empty string to turn this off.          |
| `idle`         | `'roam' \| 'gather' \| 'hide'`  | `'roam'`                           | What the swarm does while the cursor is away: drift around the area, wait in the middle, or fade out.         |
| `click-effect` | `'burst' \| 'pulse' \| 'none'`  | `'burst'`                          | What a click does. Burst splashes the swarm outward in a curl, pulse sends a wave of light through it.        |
| `hide-cursor`  | `boolean`                       | `false`                            | Hides the system cursor over the component and marks the pointer with a dot, so the swarm becomes the cursor. |
| `intro`        | `boolean`                       | `true`                             | Swirls the swarm in from across the area on mount.                                                            |
| `enabled`      | `boolean`                       | `true`                             | Shows and animates the swarm.                                                                                 |
| `light-mode`   | `boolean`                       | `false`                            | Uses near black particles by default and keeps them crisp, for light backgrounds.                             |
| `dpr`          | `number`                        | `auto`                             | Maximum device pixel ratio, capped at 2.                                                                      |
| `class`        | `string`                        | `''`                               | Extra class names for the container.                                                                          |
| `style`        | `CSSProperties`                 | `-`                                | Inline styles for the container.                                                                              |

## Slots

| Slot      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `default` | Content the swarm flows behind, such as a hero with buttons. |

## Accessibility

- The canvas carries `aria-hidden="true"`; the swarm is decorative and not keyboard focusable.
- When `hide-cursor` is enabled the system cursor is hidden over the component — use sparingly, as it removes the default pointer for mouse users.
- The swarm responds to pointer movement; touch and pen input also move it, and the swarm returns to its idle mode when a touch ends.
- With `prefers-reduced-motion: reduce` the swarm draws one still frame, gathered at the center, and click effects are off.
- The animation pauses while the component is offscreen or the tab is hidden.

---

- Ported from [React Bits](https://reactbits.dev/animations/swarm-cursor) by David Haz.
