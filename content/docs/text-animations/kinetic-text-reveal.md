---
title: Kinetic Text Reveal
description: A kinetic text reveal that segments text into words, characters, or lines and animates each into place with configurable direction, stagger, and blur.
---

::demo-kinetic-text-reveal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/kinetic-text-reveal.json"
```

## Props

| Prop            | Type                                                            | Default                                        | Description                                          |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `text`          | `string`                                                        | —                                              | The text content to animate                          |
| `split-by`      | `'words' \| 'characters' \| 'lines'`                            | `'words'`                                      | How to segment the text before animating             |
| `direction`     | `'up' \| 'down' \| 'left' \| 'right'`                           | `'up'`                                         | Direction the segments enter from                    |
| `distance`      | `number`                                                        | `20`                                           | Distance each segment travels in pixels              |
| `stagger`       | `number`                                                        | `0.075`                                        | Delay between segment animations in seconds          |
| `stagger-from`  | `'start' \| 'end' \| 'center' \| 'edges' \| 'random' \| number` | `'start'`                                      | Origin point used to calculate stagger delay         |
| `transition`    | `Transition`                                                    | `{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }` | Animation transition configuration                   |
| `blur`          | `boolean`                                                       | `true`                                         | Whether segments animate from a blurred state        |
| `auto-play`     | `boolean`                                                       | `true`                                         | Whether the reveal plays automatically on mount      |
| `delay`         | `number`                                                        | `0`                                            | Delay before autoplay in seconds                     |
| `class`         | `string`                                                        | —                                              | Additional CSS classes for the root element          |
| `segment-class` | `string`                                                        | —                                              | Additional CSS classes for each animated segment     |
| `mask-class`    | `string`                                                        | —                                              | Additional CSS classes for each segment mask wrapper |

## Events

| Event             | Description                                      |
| ----------------- | ------------------------------------------------ |
| `reveal-start`    | Emitted when the reveal animation begins         |
| `reveal-complete` | Emitted when the last segment finishes animating |

## Methods

Expose `play()` and `reset()` via a template ref to replay or clear the animation.

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import KineticTextReveal from '~/components/ui/KineticTextReveal/KineticTextReveal.vue';
  import type { KineticTextRevealRef } from '~/components/ui/KineticTextReveal/KineticTextReveal.vue';

  const reveal = ref<KineticTextRevealRef | null>(null);
</script>

<template>
  <KineticTextReveal ref="reveal" text="Replay me" />
  <button @click="reveal?.play()">Replay</button>
</template>
```
