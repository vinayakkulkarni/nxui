---
title: Click Spark
description: Bursts of sparks at every click, as dashes, comets, dots or stars, that can spill around buttons.
---

Wrap any content and every click or tap inside it sends out a burst of sparks: dashes, comets, dots or twinkling stars, with optional gravity, glow and a ring. Bursts draw on their own small canvas, so they can spill past small buttons and sit behind your content. You can also fire them from code.

::demo-click-spark
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/click-spark.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import ClickSpark from '~/components/ui/click-spark/ClickSpark.vue';
  import type { ClickSparkExposed } from '~/components/ui/click-spark/types';

  const sparks = useTemplateRef<ClickSparkExposed>('sparks');

  function celebrate() {
    // Fire from the center (or pass x, y in px from the top-left)
    sparks.value?.spark();
  }
</script>

<template>
  <ClickSpark
    ref="sparks"
    :spark-color="['#fde68a', '#fbbf24', '#ffffff']"
    shape="star"
    :spark-count="6"
    :spark-size="16"
    :spark-radius="36"
    :duration="800"
    :randomness="0.6"
    layer="back"
  >
    <button type="button" @click="celebrate">Celebrate</button>
  </ClickSpark>
</template>
```

## Props

| Prop           | Type                                                               | Default      | Description                                                                        |
| -------------- | ------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------- |
| `spark-color`  | `string \| string[]`                                               | `'#fff'`     | Spark color. Pass a list to mix colors through each burst.                         |
| `shape`        | `'line' \| 'streak' \| 'dot' \| 'star'`                            | `'line'`     | A short dash, a comet with a fading tail, a round dot, or a twinkling star.        |
| `spark-count`  | `number`                                                           | `8`          | Number of sparks in each burst (1–64).                                             |
| `spark-size`   | `number`                                                           | `14`         | Length of each spark in px.                                                        |
| `spark-width`  | `number`                                                           | `2`          | Thickness of each spark in px.                                                     |
| `spark-radius` | `number`                                                           | `30`         | How far the sparks travel from the click in px.                                    |
| `duration`     | `number`                                                           | `500`        | Length of a burst in ms.                                                           |
| `easing`       | `'ease-out' \| 'ease-in-out' \| 'ease-in' \| 'linear' \| 'spring'` | `'ease-out'` | How the sparks slow down. Spring overshoots a little and settles back.             |
| `randomness`   | `number`                                                           | `0.2`        | Varies angle, length and speed of each spark, from 0 to 1. 0 gives a perfect star. |
| `gravity`      | `number`                                                           | `0`          | Pulls the sparks down as they fly, from 0 to 2.                                    |
| `spread`       | `number`                                                           | `360`        | Angle the sparks fan across in degrees. 360 is a full circle.                      |
| `direction`    | `number`                                                           | `0`          | Where a partial spread points in degrees. 0 is up and 90 is right.                 |
| `glow`         | `number`                                                           | `0`          | Soft light around each spark, from 0 to 1.                                         |
| `ring`         | `boolean`                                                          | `false`      | Adds a thin ring that expands from the click.                                      |
| `layer`        | `'front' \| 'back'`                                                | `'front'`    | Draw over your content, or behind it so bursts spill out around buttons and cards. |
| `extra-scale`  | `number`                                                           | `1`          | Multiplies how far the sparks travel.                                              |
| `disabled`     | `boolean`                                                          | `false`      | Stops new bursts.                                                                  |
| `class`        | `string`                                                           | `''`         | Extra classes for the wrapper.                                                     |

## Exposed

| Method  | Type                               | Description                                                                          |
| ------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `spark` | `(x?: number, y?: number) => void` | Fires a burst from code. `x` and `y` are px from the top-left; centers without them. |

## Slots

| Slot      | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| `default` | Content to wrap. Clicks anywhere inside it send sparks past its edges. |

## Accessibility

- Spark canvases are decorative (`aria-hidden="true"`, `pointer-events: none`) and never block clicks or focus.
- Keyboard activation (Enter or Space on a button inside) fires a burst from the center of that element.
- With `prefers-reduced-motion: reduce` sparks hold still at a short distance and fade out in about 300 ms instead of flying.
- Canvases are removed as soon as their burst ends, and the render loop stops when nothing is left.

- Ported from [React Bits](https://reactbits.dev/animations/click-spark) by David Haz.
