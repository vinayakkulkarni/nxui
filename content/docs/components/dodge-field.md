---
title: Dodge Field
description: Wrapper that makes any child dodge the pointer until it relents and glides home.
---

A field that makes its child flee the pointer. Move toward the pill and it darts away; each near miss counts a dodge and swaps the taunt. After a few dodges it gives in, sits still and lets you click it. Touch devices never dodge.

::demo-dodge-field
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dodge-field.json"
```

## Usage

```vue
<script setup lang="ts">
  import DodgeField from '~/components/ui/dodge-field/DodgeField.vue';
</script>

<template>
  <DodgeField
    :reach="72"
    :radius="120"
    :patience="4"
    notice="Nothing dodges on touch. Tap away."
    @catch="() => console.log('caught')"
  />

  <!-- Any child, with the live state in the slot -->
  <DodgeField v-slot="{ dodges, gave }" axis="x" wall="bounce">
    <button type="button" class="rounded-full border px-4 py-2">
      {{ gave ? 'Fine, subscribe' : `Subscribe (${dodges})` }}
    </button>
  </DodgeField>
</template>
```

The pointer distance from the field centre drives a flee strength of `(1 - d / radius) ^ falloff`. The child springs `reach` pixels away along the line from the pointer, then glides home with a softer spring when the pointer leaves. A dodge counts once the pointer crosses 55% of the radius, and re-arms only after it leaves the radius.

## Props

| Prop              | Type                      | Default                                                    | Description                                                                    |
| ----------------- | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `taunts`          | `string[]`                | `['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay']` | Built-in pill labels: first at rest, one per dodge, last once it relents.      |
| `notice`          | `string`                  | `''`                                                       | One line shown under the child on touch devices, where nothing dodges.         |
| `ink-color`       | `string`                  | `'var(--foreground)'`                                      | Pill tint, text, caught fill and focus ring all derive from it.                |
| `contrast-color`  | `string`                  | `'var(--background)'`                                      | Text colour while the pill is caught.                                          |
| `field-height`    | `number`                  | `240`                                                      | Height of the invisible field in pixels; its width is the container.           |
| `reach`           | `number`                  | `72`                                                       | How far it bolts, in pixels, with the pointer on its home.                     |
| `radius`          | `number`                  | `120`                                                      | Distance from home at which it starts to react, in pixels.                     |
| `falloff`         | `number`                  | `2`                                                        | Reaction curve exponent. 1 drifts from far off; 4 flinches at the last moment. |
| `flee-duration`   | `number`                  | `130`                                                      | Settle time of the dart, in milliseconds.                                      |
| `return-duration` | `number`                  | `620`                                                      | Settle time of the glide home, in milliseconds.                                |
| `return-bounce`   | `number`                  | `0.1`                                                      | Overshoot on the way home. 0.1 is a hair, 0.3 a visible wobble.                |
| `axis`            | `'both' \| 'x' \| 'y'`    | `'both'`                                                   | Which way it may flee.                                                         |
| `wall`            | `'clamp' \| 'bounce'`     | `'clamp'`                                                  | At the field edge: stop dead, or fold the overflow back so it rebounds.        |
| `patience`        | `number`                  | `4`                                                        | Dodges before it gives in and sits still, at least 1.                          |
| `disabled`        | `boolean`                 | `false`                                                    | Sits still and stops counting; the child stays clickable.                      |
| `class`           | `HTMLAttributes['class']` | —                                                          | Extra classes for the field.                                                   |

## Events

| Event    | Payload           | Description                      |
| -------- | ----------------- | -------------------------------- |
| `dodge`  | `(count: number)` | Fired on each counted dodge.     |
| `relent` | —                 | Fired when it gives in.          |
| `catch`  | —                 | Fired when the child is clicked. |

## Slots

| Slot      | Props                                                                  | Description                                         |
| --------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| `default` | `{ dodges: number, gave: boolean, caught: boolean, fleeing: boolean }` | What flees. Omit it for the built-in taunting pill. |

## Accessibility

- The built-in pill is a real `<button>`; keyboard users reach it with Tab and press it with Enter or Space. Keyboard focus never makes it dodge.
- With `prefers-reduced-motion: reduce` it never moves, and the label crossfade drops its blur.
- Never wrap a decline, close or cancel control in a field that dodges.

- Ported from [React Bits](https://reactbits.dev/micro/dodge-field) by David Haz.
