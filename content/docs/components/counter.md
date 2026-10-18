---
title: Counter
description: An odometer-style number whose digits roll to every new value with springy motion blur, and that formats currency, percentages, separators and locales.
---

An odometer-style number. Every digit rolls on a spring to its new value, blurs while it spins fast, and slides in or out as the number grows or shrinks. Formatting comes from `Intl.NumberFormat`, so currency, percentages, compact notation, units, separators and non-Latin numerals all work. On first scroll into view every digit spins once and lands. Switch scenes in the panel, then press the buttons to change the numbers.

::demo-counter
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/counter.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import Counter from '~/components/ui/counter/Counter.vue';

  const revenue = ref(48203.17);
</script>

<template>
  <Counter
    :value="revenue"
    :format="{ style: 'currency', currency: 'USD' }"
    :decimals="2"
    :font-size="52"
    :font-weight="600"
  />

  <!-- Countdown tile: padded digits on a background -->
  <Counter
    :value="9"
    :min-digits="2"
    direction="down"
    :fade="0"
    :gap="6"
    :digit-style="{
      padding: '0.18em 0.14em',
      borderRadius: '0.18em',
      background: 'var(--secondary)',
    }"
  />
</template>
```

## Props

| Prop          | Type                                     | Default     | Description                                                                         |
| ------------- | ---------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `value`       | `number`                                 | `0`         | The number to show. Digits roll to every new value                                  |
| `locale`      | `string \| string[]`                     | `'en-US'`   | Locale used for separators, symbols and numerals                                    |
| `format`      | `Intl.NumberFormatOptions`               | —           | Formatting options such as currency, percent, units or compact notation             |
| `decimals`    | `number`                                 | —           | Fixed number of decimal places. Leave it out to use the format defaults             |
| `min-digits`  | `number`                                 | `1`         | Pads the whole part with leading zeros                                              |
| `prefix`      | `string`                                 | —           | Text shown before the number (or use the `prefix` slot)                             |
| `suffix`      | `string`                                 | —           | Text shown after the number (or use the `suffix` slot)                              |
| `direction`   | `'auto' \| 'up' \| 'down' \| 'shortest'` | `'auto'`    | Which way digits roll. Auto rolls up as the number grows and down as it shrinks     |
| `duration`    | `number`                                 | `0.7`       | Roughly how long a roll takes (seconds)                                             |
| `bounce`      | `number`                                 | `0.2`       | How much digits overshoot before settling, 0–0.9                                    |
| `stagger`     | `number`                                 | `0.04`      | Delay between neighbouring digits (seconds), so changes ripple from the right       |
| `motion-blur` | `boolean`                                | `true`      | Blurs digits along their path while they spin fast                                  |
| `intro`       | `boolean`                                | `true`      | Spins every digit once and lands it when the counter first scrolls into view        |
| `fade`        | `number`                                 | `0.3`       | How far (em) digits roll beyond the text before fading out. `0` clips at the edge   |
| `font-size`   | `number \| string`                       | `100`       | Font size in px, or any CSS size such as `inherit`                                  |
| `font-weight` | `number \| string`                       | `'inherit'` | Font weight of the number                                                           |
| `text-color`  | `string`                                 | `'inherit'` | Color of the number                                                                 |
| `gap`         | `number`                                 | `0`         | Space between digits and symbols (px)                                               |
| `padding`     | `number`                                 | `0`         | Extra height (px) added to each digit, which also spaces out rolling digits         |
| `tabular`     | `boolean`                                | `true`      | Keeps every digit the same width. When off, widths ease between digits as they roll |
| `digit-style` | `StyleValue`                             | —           | Styles for each digit box, for example a tile background with padding and radius    |
| `class`       | `string`                                 | `''`        | Extra classes for the root                                                          |

## Slots

| Slot     | Description                                         |
| -------- | --------------------------------------------------- |
| `prefix` | Content shown before the number. Overrides `prefix` |
| `suffix` | Content shown after the number. Overrides `suffix`  |

## Accessibility

- Screen readers get the fully formatted value (with prefix and suffix) from a visually hidden label; the rolling digits are `aria-hidden`.
- With `prefers-reduced-motion: reduce` digits jump straight to their value and the intro spin is skipped.
- The digit row reads left to right even in right-to-left pages, so numbers never mirror.

- Ported from [React Bits](https://reactbits.dev/components/counter) by David Haz.
