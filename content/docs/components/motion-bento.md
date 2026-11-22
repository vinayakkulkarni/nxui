---
title: Motion Bento
description: A services bento grid whose cards carry looping illustrated artwork — a product carousel, an SLA envelope, an integrations orbit, a design editor and a hosting bolt.
---

# Motion Bento

A section for service or feature overviews. A headline with a call-to-action sits above a 12-column grid of cards. Each card shows a soft gradient illustration that plays its own loop, with a title and a one-line description under it. Pick one of five built-in artworks per card, or draw your own in the `art` slot. The loops run on their own, pause when the section scrolls out of view, and cards lift on hover.

::demo-motion-bento
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/motion-bento.json"
```

## Usage

```vue
<script setup lang="ts">
  import MotionBento from '~/components/ui/motion-bento/MotionBento.vue';
  import type { MotionBentoItem } from '~/components/ui/motion-bento/types';

  const items: MotionBentoItem[] = [
    {
      title: 'E-Commerce Systems',
      description: 'Storefronts that keep orders moving.',
      art: 'commerce',
      span: 7,
    },
    {
      title: 'Enterprise SLA',
      description: 'Uptime written into the contract.',
      art: 'sla',
      span: 5,
    },
    { title: 'Custom Development', art: 'integrations' },
    { title: 'UI/UX Design', art: 'design' },
    { title: 'Your own artwork' },
  ];
</script>

<template>
  <MotionBento
    heading="Not a generic agency. A studio with a contractual commitment to performance."
    highlight="contractual commitment"
    cta-label="Book a strategy call"
    :items="items"
  >
    <template #art="{ playing }">
      <div class="grid size-full place-items-center">
        <span :class="playing ? 'animate-pulse' : ''">Custom art</span>
      </div>
    </template>
  </MotionBento>
</template>
```

Cards without an `art` value render the `art` slot. Use `playing` from the slot to start and stop your own animation.

## Props

| Prop        | Type                | Default     | Description                                               |
| ----------- | ------------------- | ----------- | --------------------------------------------------------- |
| `items`     | `MotionBentoItem[]` | —           | Cards, placed in order into a 12-column grid.             |
| `heading`   | `string`            | `''`        | Section headline.                                         |
| `highlight` | `string`            | `''`        | Part of `heading` drawn in a heavier weight.              |
| `cta-label` | `string`            | `''`        | Label of the call-to-action button. Empty hides it.       |
| `cta-href`  | `string`            | `''`        | Turns the call-to-action into a link.                     |
| `accent`    | `string`            | `'#3b8cf0'` | Accent colour for the artwork backgrounds and the button. |
| `paused`    | `boolean`           | `false`     | Freezes every artwork loop.                               |
| `class`     | `string`            | `''`        | Extra classes for the root element.                       |

## Item options

| Option        | Type                                                             | Description                                                   |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `title`       | `string`                                                         | Card title.                                                   |
| `description` | `string`                                                         | One line under the title.                                     |
| `art`         | `'commerce' \| 'sla' \| 'integrations' \| 'design' \| 'hosting'` | Built-in artwork. Leave empty to use the `art` slot.          |
| `span`        | `3 \| 4 \| 5 \| 6 \| 7 \| 8 \| 12`                               | Columns the card spans from the `md` breakpoint. Default `4`. |

The built-in artworks:

- `commerce` — three product cards rotate through a centre spot while the order count ticks up.
- `sla` — an envelope opens, a check badge rises out of it and three service chips pop in.
- `integrations` — four integration tiles orbit a central app tile in quarter turns.
- `design` — an editor panel with moving sliders, a scrolling strip of design tools and two collaborator cursors.
- `hosting` — a glass lightning bolt with a breathing frame and light pulses running along circuit lines.

## Slots and events

| Name           | Props                             | Description                                             |
| -------------- | --------------------------------- | ------------------------------------------------------- |
| `#header` slot | —                                 | Replaces the headline.                                  |
| `#cta` slot    | —                                 | Replaces the call-to-action button.                     |
| `#art` slot    | `{ item, index, playing, still }` | Artwork for cards without an `art` value.               |
| `cta` event    | —                                 | Fires when the button is clicked and has no `cta-href`. |

## Accessibility

- The section is labelled by its headline, and each card title is an `h3`.
- The artwork is decorative and hidden from screen readers.
- The button and link show a focus ring.
- With reduced motion turned on, every artwork shows one finished, still frame and cards do not lift on hover.
