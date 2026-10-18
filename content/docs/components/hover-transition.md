---
title: Hover Transition
description: A hover wrapper that swaps two slots with one of eight transitions — wipe, ripple, parallax, curtain, diagonal, morph, strips or slide — from any of nine directions.
---

A focusable wrapper with two slots: the default slot shows at rest, the `hover` slot is revealed when the pointer enters or the card takes keyboard focus. Pick the effect and direction per card, tune the timing, and the card also tilts and catches a soft glare as the mouse moves. Hover a teammate below, or click one and use the panel to change its effect, direction and color.

::demo-hover-transition
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hover-transition.json"
```

## Usage

```vue
<script setup lang="ts">
  import { HoverTransition } from '~/components/ui/hover-transition';
</script>

<template>
  <HoverTransition
    effect="wipe"
    direction="right"
    :duration="0.72"
    class="aspect-4/5 w-full max-w-sm rounded-3xl"
  >
    <article class="flex h-full flex-col justify-between bg-[#ece9e1] p-6">
      <span class="text-xs tracking-[0.16em] uppercase">Product Designer</span>
      <h3 class="text-3xl font-medium">Maya Chen</h3>
    </article>
    <template #hover>
      <article class="flex h-full flex-col justify-between bg-[#dfff5f] p-6">
        <p class="text-xl/tight font-medium">
          Turning complex product ideas into clear, expressive experiences.
        </p>
        <p class="font-semibold">Maya Chen</p>
      </article>
    </template>
  </HoverTransition>
</template>
```

Both slots receive `{ active }`. The root carries `data-active="true"` while revealed, so content inside the slots can stage its own entrance with `group-data-[active=true]:…` classes (add `group` to the wrapper's `class`). Effects that move the resting content (`parallax`, `curtain`, `diagonal`, `slide`) render extra copies of the default slot, and `strips` renders eight copies of the hover slot, so keep slot content free of side effects.

## Props

| Prop        | Type                                                                                                                 | Default                            | Description                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `effect`    | `'wipe' \| 'ripple' \| 'parallax' \| 'curtain' \| 'diagonal' \| 'morph' \| 'strips' \| 'slide'`                      | `'wipe'`                           | The transition used to swap the two slots.         |
| `direction` | `'top' \| 'right' \| 'bottom' \| 'left' \| 'top-left' \| 'top-right' \| 'bottom-right' \| 'bottom-left' \| 'center'` | `'right'`                          | The origin or travel direction of the effect.      |
| `duration`  | `number`                                                                                                             | `0.72`                             | Animation duration in seconds.                     |
| `easing`    | `string`                                                                                                             | `'cubic-bezier(0.22, 1, 0.36, 1)'` | Any valid CSS easing value.                        |
| `label`     | `string`                                                                                                             | `'Interactive hover transition'`   | Accessible label for the focusable wrapper.        |
| `class`     | `string`                                                                                                             | —                                  | Sizing, radius and layout classes for the wrapper. |

## Slots

| Slot      | Props                 | Description                                                    |
| --------- | --------------------- | -------------------------------------------------------------- |
| `default` | `{ active: boolean }` | Content shown at rest. Falls back to a built-in demo card.     |
| `hover`   | `{ active: boolean }` | Content revealed by the effect. Falls back to a built-in card. |

## Accessibility

- The wrapper is a `role="group"` with an `aria-label` and `tabindex="0"`, so keyboard users reveal the hover content by focusing it; it stays revealed while focus moves inside it.
- Animated copies of the slots are `aria-hidden`; only the base default slot is in the accessibility tree.
- A visible focus ring uses the theme `foreground` token.
- With `prefers-reduced-motion: reduce`, durations drop to zero, and the tilt and glare are switched off.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/hover-transition) by Harsh Jadhav.
