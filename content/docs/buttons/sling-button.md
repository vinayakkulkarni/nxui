---
title: Sling Button
description: Send button you pull back like a slingshot and release to fire, with a stretching band, a power arc and a particle burst.
---

Pull the pad away from its seat. A band stretches behind it and an arc fills to show the load. Past the arm distance, let go and the pad snaps back through its seat and throws a burst of particles. A short pull springs back without sending. A plain tap, Enter or Space also sends.

::demo-sling-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/sling-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import SlingButton from '~/components/ui/sling-button/SlingButton.vue';

  function send() {
    console.log('sent');
  }
</script>

<template>
  <SlingButton :arm-at="48" :max-pull="160" :particles="14" @send="send" />
</template>
```

## Props

| Prop           | Type                                  | Default     | Description                                                      |
| -------------- | ------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `pad-color`    | `string`                              | `'#f5f5f5'` | The pad fill.                                                    |
| `icon-color`   | `string`                              | `'#18181b'` | The pad content colour.                                          |
| `accent-color` | `string`                              | `'#f5f5f5'` | The power arc, the loaded band and the particles.                |
| `well-color`   | `string`                              | `'#27272a'` | The seat the pad rests in.                                       |
| `band-color`   | `string`                              | `'#52525b'` | The band before it loads.                                        |
| `size`         | `number`                              | `56`        | Pad diameter in pixels. Seat, hit area and particles follow.     |
| `stroke-width` | `number`                              | `3`         | Arc and band thickness in pixels.                                |
| `arm-at`       | `number`                              | `48`        | Pull distance in pixels that loads the send.                     |
| `max-pull`     | `number`                              | `160`       | How far the band can stretch before it stops giving.             |
| `launch-speed` | `number`                              | `2600`      | Speed the band adds on release, in px/s.                         |
| `recoil`       | `number`                              | `0.2`       | Bounce of the return spring. `0` stops dead.                     |
| `flight`       | `number`                              | `120`       | How far the lead particle flies, in pixels.                      |
| `particles`    | `number`                              | `14`        | How many particles a launch throws. `1` is one dot, `0` is none. |
| `spread`       | `number`                              | `60`        | The cone the burst fans across, in degrees.                      |
| `axis`         | `'any' \| 'horizontal' \| 'vertical'` | `'any'`     | Free pull, or one axis with a little give across it.             |
| `tap-sends`    | `boolean`                             | `true`      | Whether a plain tap sends. Enter always does.                    |
| `disabled`     | `boolean`                             | `false`     | Dims the pad and ignores input.                                  |
| `aria-label`   | `string`                              | `'Send'`    | Accessible name of the button.                                   |
| `class`        | `string`                              | `''`        | Extra classes for the root element.                              |

## Events and slots

| Name         | Payload | Description                                                                        |
| ------------ | ------- | ---------------------------------------------------------------------------------- |
| `send` event | —       | Fires on a loaded release, on a tap when `tap-sends` is on, and on Enter or Space. |
| default slot | —       | Replaces the pad content. The default is an up arrow.                              |

## Accessibility

- The pad is a native `button`, so Enter and Space send.
- A visually hidden hint is linked with `aria-describedby`.
- Escape during a drag cancels it without sending.
- `disabled` sets `aria-disabled` and ignores input.
- With reduced motion, the band fades out instead of springing, and the seat flashes instead of throwing particles.

- Ported from [React Bits](https://reactbits.dev/micro/sling-button) by David Haz.
