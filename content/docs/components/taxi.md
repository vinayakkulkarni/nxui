---
title: Taxi
description: A taxi-hailing card that runs a whole ride from one tap. The glyph morphs from a waving person to the cab to a check, and the ETA counts down.
---

# Taxi

A taxi-hailing card that runs the whole ride from one tap. Tap **Taxi!** to hail: the panel narrows and goo bubbles along its edge while it searches, then a driver is found and the ETA counts down from 4 min as the car dot slides along the track. Tap **Get in** when the cab arrives, watch the ride count down from 12 min, then rate it with the stars. The glyph in the corner morphs point for point between a waving person, the cab and a check. Tap the panel while it searches or while the cab is on its way to cancel.

::demo-taxi
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/taxi.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import Taxi from '~/components/ui/taxi/Taxi.vue';
  import type { TaxiStateName } from '~/components/ui/taxi/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onRate(stars: number) {
    console.log('rated', stars);
  }

  function onState(state: TaxiStateName) {
    console.log('now', state);
  }
</script>

<template>
  <Taxi
    :width="300"
    :theme="theme"
    sound-base="/sounds/taxi"
    @rate="onRate"
    @state="onState"
  />
</template>
```

A ride moves through `idle` → `searching` → `enroute` → `arrived` → `riding` → `done` → `thanks` and back to `idle`. Searching, the countdowns and the thank-you advance on their own; the taps and the rating move it on. The component also exposes `tap()` and `rate(stars)` through a template ref, so a host can drive a ride.

## Props

| Prop         | Type                | Default   | Description                                                                                                                                                         |
| ------------ | ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`      | `number`            | `300`     | Card width in px. It narrows further on a small screen; everything scales with it.                                                                                  |
| `theme`      | `'light' \| 'dark'` | `'light'` | `light` is ink on a yellow cab. `dark` turns the card to night with the glyph and panel lit in cab yellow. Pass your site's colour mode.                            |
| `sound`      | `boolean`           | `true`    | Plays the ride's cues when `sound-base` points at them. Toggling it mutes or unmutes without restarting the ride.                                                   |
| `sound-base` | `string`            | `''`      | Folder with the cue files `tap`, `open`, `cancel`, `ping`, `found`, `tick`, `horn`, `door`, `engine`, `done`, `star` and `thanks` (all `.wav`). Empty means silent. |
| `class`      | `string`            | `''`      | Extra classes for the root element.                                                                                                                                 |

## Events

| Event   | Payload                  | Description                                    |
| ------- | ------------------------ | ---------------------------------------------- |
| `rate`  | `(stars: number)`        | Fires once a finished ride has been rated.     |
| `state` | `(state: TaxiStateName)` | Fires each time the ride moves to a new state. |

## Accessibility

- The panel is one `button` whose `aria-label` follows the ride (for example "Taxi on the way. Tap to cancel"). It is disabled while riding and once the ride is done, when there is nothing to press.
- The status line and the three detail lines are `aria-live="polite"`, so each change of state is announced.
- The rating is a `role="group"` labelled "Rate your ride" of five 44px buttons labelled "1 star" to "5 stars", with `aria-pressed` set on the stars given.
- Focus rings are visible on the panel and on each star.
- With reduced motion the entrance, the letter rolls, the glyph morph, the goo, the wave and the bob are skipped; states switch instantly and the track still fills.

Ported from [Taxi](https://pinui.xyz/components/taxi) by Pin UI, MIT licence.
