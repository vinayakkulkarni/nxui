---
title: Tear Ticket
description: A ticket whose perforated stub tears off by hand, fibre by fibre, then drops away and leaves a used, greyed ticket.
---

# Tear Ticket

A ticket with a perforated stub. Grab the stub and pull it away from the ticket: it pivots from the end of the tear line, the paper bridges between the holes stretch into fibres and snap one by one, and once the last bridge goes the stub hangs from your pointer. Let go and it drops with gravity and fades. The ticket then turns grey and glides over to sit centred. Release before the tear finishes and the stub springs back. The whole ticket leans toward the cursor in 3D, and the artwork moves against the tilt.

::demo-tear-ticket
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/tear-ticket.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import TearTicket from '~/components/ui/tear-ticket/TearTicket.vue';

  const torn = ref(false);
</script>

<template>
  <TearTicket
    v-model:torn="torn"
    image="https://images.unsplash.com/photo-1604852961945-155837ffebe2?w=1200"
    image-alt="Visitors in a walkway of coloured glass"
    :scrim="false"
    :tear-angle="30"
    :resistance="0.45"
    @tear="console.log('used')"
  >
    <div class="flex h-full items-end justify-between px-6 pb-8">
      <span>Spectrum</span>
      <span class="opacity-45">14 Nov</span>
    </div>
    <template #stub>
      <div class="p-6">Admit one</div>
    </template>
  </TearTicket>
  <button @click="torn = false">Restore stub</button>
</template>
```

Inside the slots you can use the CSS variables `--tt-body-w`, `--tt-body-h`, `--tt-span` and `--tt-inset` to place text under the artwork.

## Props

| Prop              | Type                         | Default               | Description                                                                                   |
| ----------------- | ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `image`           | `string`                     | `''`                  | Artwork behind the body. It shifts against the tilt and turns grey once used.                 |
| `image-alt`       | `string`                     | `''`                  | Alt text for the artwork.                                                                     |
| `scrim`           | `boolean`                    | `true`                | A fade from the paper colour over the artwork, so text stays readable on busy images.         |
| `image-radius`    | `number`                     | `8`                   | Corner radius of the artwork panel in px. Use the ticket radius minus 8 to stay concentric.   |
| `orientation`     | `'horizontal' \| 'vertical'` | `'horizontal'`        | Horizontal puts the stub on the right. Vertical puts the artwork on top and the stub below.   |
| `torn`            | `boolean`                    | `undefined`           | Controlled state (`v-model:torn`). Set it back to `false` to restore the stub.                |
| `default-torn`    | `boolean`                    | `false`               | Start already used (uncontrolled).                                                            |
| `width`           | `number`                     | `460`                 | Ticket width in px. It scales down to fit a narrower parent.                                  |
| `height`          | `number`                     | `250`                 | Ticket height in px.                                                                          |
| `stub-size`       | `number`                     | `150`                 | Stub size along the ticket in px: its width when horizontal, its height when vertical.        |
| `radius`          | `number`                     | `16`                  | Outer corner radius in px.                                                                    |
| `holes`           | `number`                     | `12`                  | Perforation holes along the tear line.                                                        |
| `hole-size`       | `number`                     | `6`                   | Hole diameter in px.                                                                          |
| `notch`           | `number`                     | `3`                   | Radius of the notches at both ends of the tear line.                                          |
| `roughness`       | `number`                     | `0`                   | Jitter of the torn line between holes in px. `0` keeps the edge straight.                     |
| `tear-angle`      | `number`                     | `30`                  | Degrees of pull at which the last bridge gives way and the stub comes free.                   |
| `stretch`         | `number`                     | `30`                  | How far a paper bridge stretches before it snaps, in px. Bridges far from the hinge go first. |
| `resistance`      | `number`                     | `0.45`                | How much the intact fibres hold the stub back, 0 to 1. The pull eases as bridges give way.    |
| `rotate`          | `number`                     | `4`                   | Resting tilt of the whole ticket in the page plane, in degrees.                               |
| `tilt`            | `boolean`                    | `true`                | The ticket leans toward the cursor in 3D.                                                     |
| `tilt-max`        | `number`                     | `9`                   | Largest tilt angle in degrees.                                                                |
| `tilt-reach`      | `number`                     | `260`                 | How far beyond the ticket the pointer still steers the tilt, in px.                           |
| `parallax`        | `number`                     | `6`                   | How far the artwork travels against the tilt, in px.                                          |
| `perspective`     | `number`                     | `1000`                | Viewing distance in px.                                                                       |
| `background`      | `string`                     | `'#27272a'`           | Paper colour, also used by the fibres.                                                        |
| `color`           | `string`                     | `'#f5f5f5'`           | Text colour.                                                                                  |
| `border`          | `boolean`                    | `true`                | A hairline along the cut edge of each piece, following every hole and notch.                  |
| `border-color`    | `string`                     | `''`                  | Hairline colour. Empty derives a faint tint of the text colour.                               |
| `border-width`    | `number`                     | `1`                   | Hairline thickness in px.                                                                     |
| `stub-background` | `string`                     | `''`                  | Stub paper colour. Empty follows `background`.                                                |
| `recenter`        | `boolean`                    | `true`                | Once the stub is gone, the remaining ticket glides over to sit centred in its box.            |
| `disabled`        | `boolean`                    | `false`               | Dimmed and inert.                                                                             |
| `aria-label`      | `string`                     | `'Tear off the stub'` | Accessible name of the stub.                                                                  |
| `class`           | `string`                     | `''`                  | Extra classes for the root element.                                                           |

## Slots and events

| Name                | Props     | Description                                   |
| ------------------- | --------- | --------------------------------------------- |
| default slot        | —         | Content of the ticket body.                   |
| `#stub` slot        | —         | Content of the tear-off stub.                 |
| `tear` event        | —         | Fires once the stub has come free and gone.   |
| `update:torn` event | `boolean` | Emits `true` with `tear`, for `v-model:torn`. |

## Accessibility

- The stub is a focusable `role="button"` named by `aria-label`. Enter or Space tears it at once.
- A visually hidden `role="status"` region announces "Used" after the tear.
- With reduced motion, the tilt, parallax and fibres are off, and a short drag on the stub tears it at once.

- Ported from [React Bits](https://reactbits.dev/micro/tear-ticket) by David Haz.
