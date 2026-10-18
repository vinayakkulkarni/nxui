---
title: Crystalized Ball
description: A WebGL glass ball with a crackling electric rim and glowing dust that swirls with the cursor.
---

A glass ball with an electric rim and glowing dust inside it. Move the cursor near the ball and the rim heats up and flares toward it, while the dust swirls in its wake and turns to follow. Click the ball to shake it.

::demo-crystalized-ball
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/crystalized-ball.json"
```

## Usage

```vue
<script setup lang="ts">
  import CrystalizedBall from '~/components/ui/crystalized-ball/CrystalizedBall.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <CrystalizedBall
      preset="ember"
      theme="dark"
      :size="0.7"
      :particle-count="20000"
      motion="orbit"
    />
  </div>
</template>
```

A preset sets every value marked _from preset_, including the color. Pass any of those props to override the preset value. All the rim, glow, spark, haze and dust tones are derived from the one `color`.

## Props

| Prop             | Type                                                                                        | Default     | Description                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `preset`         | `'plasma' \| 'aurora' \| 'nebula' \| 'ember' \| 'frost' \| 'solar' \| 'eclipse' \| 'abyss'` | `'plasma'`  | A complete starting look, color included                                                         |
| `color`          | `string`                                                                                    | from preset | The one color of the ball. All other tones are derived from it                                   |
| `theme`          | `'dark' \| 'light'`                                                                         | `'dark'`    | Dark renders the ball as emitted light. Light draws it in crisp ink with a white-hot rim core    |
| `size`           | `number`                                                                                    | `0.7`       | Diameter as a fraction of the smaller side of the container                                      |
| `strands`        | `number`                                                                                    | from preset | Electric strands braided around the rim, 1 to 8                                                  |
| `crackle`        | `number`                                                                                    | from preset | How far the strands bend and jitter                                                              |
| `flares`         | `number`                                                                                    | from preset | How far the glow licks outward from the rim in slow, travelling flares                           |
| `glow`           | `number`                                                                                    | from preset | Strength of the halo around the rim                                                              |
| `sparks`         | `number`                                                                                    | from preset | How often small arcs discharge along the inside of the rim. `0` turns them off                   |
| `particle-count` | `number`                                                                                    | from preset | Number of dust particles, up to 40000                                                            |
| `fill`           | `number`                                                                                    | from preset | How full the ball is. Low values pool the dust at the bottom, high values float it up            |
| `motion`         | `'rise' \| 'fall' \| 'drift' \| 'orbit'`                                                    | from preset | Rise floats like embers, fall drifts down like snow, drift wanders, orbit loops in small circles |
| `particle-shape` | `'square' \| 'round'`                                                                       | from preset | Crisp square pixels or soft round dots                                                           |
| `depth`          | `number`                                                                                    | from preset | Strength of the depth cues. Dust at the back gets smaller and dimmer                             |
| `sway`           | `number`                                                                                    | from preset | How much the dust turns back and forth inside the glass                                          |
| `twinkle`        | `number`                                                                                    | from preset | How much the dust sparkles on and off                                                            |
| `haze`           | `number`                                                                                    | from preset | Strength of the glow pooled under the dust and along the inside of the glass                     |
| `speed`          | `number`                                                                                    | `1`         | Animation speed of the rim, flares and sparks                                                    |
| `dust-speed`     | `number`                                                                                    | from preset | Animation speed of the dust                                                                      |
| `interactive`    | `boolean`                                                                                   | `true`      | Lets the cursor heat the rim, stir and turn the dust, and shake the ball on click                |
| `hover-strength` | `number`                                                                                    | `0.7`       | How strongly the ball reacts to the cursor, 0 to 1                                               |
| `intro`          | `boolean`                                                                                   | `true`      | On mount the rim powers up and the dust lights up from the bottom                                |
| `paused`         | `boolean`                                                                                   | `false`     | Freezes the animation. The dust can still be stirred                                             |
| `class`          | `string`                                                                                    | `''`        | Extra classes for the root element                                                               |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Add a visible caption or an `aria-label` on a parent if the ball carries meaning.
- With `prefers-reduced-motion: reduce` the ball renders one still frame, the intro is skipped and the cursor does not move it.
- The render loop stops while the ball is offscreen or idle (paused and settled), and the WebGL context is released on unmount.
- Needs WebGL 2. Without it the component renders an empty container.

- Ported from [React Bits](https://reactbits.dev/animations/crystalized-ball) by David Haz.
