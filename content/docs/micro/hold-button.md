---
title: Hold Button
description: Hold-to-confirm button whose liquid fill rises while pressed and snaps back if you let go.
---

A press-and-hold confirm button. Hold it with the mouse, a finger, Space or Enter: a liquid fill with a moving wave crest sweeps across at constant speed, the glow charges, and when the fill completes the label blurs into the done state and `hold` fires. Let go early, drag away or press Escape and the fill snaps back.

::demo-hold-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hold-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import HoldButton from '~/components/ui/hold-button/HoldButton.vue';

  function onHold() {
    console.log('confirmed');
  }
</script>

<template>
  <HoldButton
    icon="lucide:trash-2"
    done-icon="lucide:check"
    done-label="Deleted"
    fill-color="#5227FF"
    :hold-time="2000"
    @hold="onHold"
  >
    Hold to delete
  </HoldButton>
</template>
```

## Props

| Prop               | Type                   | Default     | Description                                                     |
| ------------------ | ---------------------- | ----------- | --------------------------------------------------------------- |
| `done-label`       | `string`               | `'Deleted'` | Label that blurs in when the hold completes                     |
| `icon`             | `string`               | —           | Iconify name shown before the idle label                        |
| `done-icon`        | `string`               | —           | Iconify name shown before the done label                        |
| `background-color` | `string`               | `'#27272a'` | Button body colour                                              |
| `fill-color`       | `string`               | `'#5227FF'` | Colour of the fill, its wave, the glow and the focus ring       |
| `text-color`       | `string`               | `'#f5f5f5'` | Label colour outside the fill                                   |
| `fill-text-color`  | `string`               | `'#ffffff'` | Label colour inside the fill; the ink inverts as the edge moves |
| `size`             | `'sm' \| 'md' \| 'lg'` | `'md'`      | Height, padding and font size preset                            |
| `radius`           | `number`               | `14`        | Corner radius in pixels                                         |
| `fill-direction`   | `'right' \| 'up'`      | `'right'`   | Sweep left to right, or rise from the bottom                    |
| `hold-time`        | `number`               | `2000`      | How long the press must last, in ms                             |
| `release-time`     | `number`               | `200`       | How fast the fill snaps back on early release or reset, in ms   |
| `press-scale`      | `number`               | `0.97`      | Squash while a pointer holds it. `1` disables it                |
| `wave`             | `boolean`              | `true`      | Scrolling meniscus on the leading edge of the fill              |
| `wave-amplitude`   | `number`               | `6`         | Height of the wave crests in pixels                             |
| `glow`             | `boolean`              | `true`      | Glow that charges with the hold and pulses on completion        |
| `reset-after`      | `number`               | `1200`      | Ms the done state stays before resetting. `0` keeps it done     |
| `disabled`         | `boolean`              | `false`     | Dims the button and ignores input                               |
| `class`            | `string`               | `''`        | Extra classes for the button                                    |

## Events

| Event  | Payload | Description                                           |
| ------ | ------- | ----------------------------------------------------- |
| `hold` | —       | Fired once, on the frame the fill completes           |
| `tap`  | —       | Fired on a release under 250ms that did not drift off |

## Slots

| Slot        | Description                               |
| ----------- | ----------------------------------------- |
| `default`   | Idle label (defaults to “Hold to delete”) |
| `done`      | Done label; overrides `done-label`        |
| `icon`      | Idle icon; overrides the `icon` prop      |
| `done-icon` | Done icon; overrides the `done-icon` prop |

## Accessibility

- Native `<button>`; Space and Enter start the hold, releasing the key ends it and Escape cancels a keyboard hold.
- A visually hidden hint (“Press and hold for 2 seconds to confirm”) is linked with `aria-describedby`.
- The hold cancels if the window loses focus or the tab is hidden.
- With `prefers-reduced-motion`, the sweep, wave and pulse are replaced by a plain cross-fade of the fill.

- Ported from [React Bits](https://reactbits.dev/micro/hold-button) by David Haz.
