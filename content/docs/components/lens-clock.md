---
title: Lens Clock
description: A live clock widget that frames a corner of a large dial. The view pans with the hour hand and the edges fall out of focus.
---

A live clock that shows only a corner of a large dial. The dial pans so the hour hand always points out of the frame, the seconds hand sweeps smoothly, and the edges blur like a shallow depth of field. Set a time zone to show any city, or pass a fixed `time` and the hands spring into place. Open the pane to change the zone, palette, size and a frozen time.

::demo-lens-clock
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lens-clock.json"
```

## Usage

```vue
<script setup lang="ts">
  import LensClock from '~/components/ui/lens-clock/LensClock.vue';

  const cities = [
    { name: 'San Francisco', timeZone: 'America/Los_Angeles' },
    { name: 'New York', timeZone: 'America/New_York' },
    { name: 'London', timeZone: 'Europe/London' },
  ];
</script>

<template>
  <div class="flex flex-wrap gap-6">
    <figure
      v-for="city in cities"
      :key="city.timeZone"
      class="flex flex-col items-center gap-3"
    >
      <LensClock :time-zone="city.timeZone" class="w-52" />
      <figcaption class="text-sm text-muted-foreground">
        {{ city.name }}
      </figcaption>
    </figure>
  </div>
</template>
```

Without a `theme` prop the palette follows the `dark` class on an ancestor. Size it with a width class; everything inside scales with the card.

## Props

| Prop        | Type                | Default     | Description                                                                        |
| ----------- | ------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `time-zone` | `string`            | viewer zone | IANA time zone, such as `'America/Los_Angeles'`. Unknown zones fall back to yours. |
| `time`      | `Date`              | —           | Fixed moment to display, shown in `time-zone`. Omit it to keep the clock live.     |
| `theme`     | `'light' \| 'dark'` | —           | Force a palette. Omit it to follow the surrounding `dark` class.                   |
| `class`     | `string`            | `'w-72'`    | Extra classes merged on the card. Use a width class to size it.                    |

## Accessibility

- The card is `role="img"` with an `aria-label` such as "Clock showing 10:09", updated each minute; the drawing itself is hidden from screen readers.
- With `prefers-reduced-motion: reduce` the seconds hand steps once a second instead of sweeping, and a fixed `time` jumps into place instead of springing.
- The animation loop pauses while the clock is off screen.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/lens-clock) by Harsh Jadhav.
