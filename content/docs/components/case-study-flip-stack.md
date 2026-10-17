---
title: Case Study Flip Stack
description: An editorial, scroll-driven case study stack where each full-width card folds upward to reveal the next story beneath it.
---

An editorial case study sequence. Scroll down: the stack pins in place and each card folds up and away, while the card below lifts from its resting offset to take its place.

::demo-case-study-flip-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/case-study-flip-stack.json"
```

## Usage

```vue
<script setup lang="ts">
  import CaseStudyFlipStack from '~/components/ui/case-study-flip-stack/CaseStudyFlipStack.vue';
  import type { CaseStudyFlipItem } from '~/components/ui/case-study-flip-stack/types';

  const items: CaseStudyFlipItem[] = [
    {
      eyebrow: 'Fintech',
      title: 'Boosted conversion by 42% with a product-led redesign',
      description: 'We rebuilt onboarding around the moments that matter.',
      image: '/work/fintech.jpg',
      imageAlt: 'Portrait from the fintech campaign',
      background: '#a94808',
      foreground: '#fff7ed',
    },
    {
      eyebrow: 'Hospitality',
      title: 'A slower digital experience for a faster-growing retreat',
      description:
        'A cinematic booking journey with a stronger sense of place.',
      image: '/work/retreat.jpg',
      imageAlt: 'A mountain retreat at dusk',
      background: '#067b8f',
      foreground: '#ecfeff',
    },
  ];
</script>

<template>
  <CaseStudyFlipStack :items="items" />
</template>
```

The stack tracks the nearest scrollable ancestor, or the window when there is none. Section heights follow that scroller's height, so it works full-page and inside a scrolling panel.

## Props

| Prop        | Type                  | Default                   | Description                                                |
| ----------- | --------------------- | ------------------------- | ---------------------------------------------------------- |
| `items`     | `CaseStudyFlipItem[]` | 4 sample case studies     | Case studies with copy, image, alt text, and card colors   |
| `hint`      | `string`              | `'Scroll Down'`           | The animated opening instruction between the arrows        |
| `heading`   | `string`              | `'Design That Delivers.'` | The large introduction heading shown before the card stack |
| `end-label` | `string`              | `'The End'`               | The closing message revealed after the final card stacks   |
| `class`     | `string`              | `''`                      | Additional classes for the root container                  |

### `CaseStudyFlipItem`

| Field         | Type     | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| `number`      | `string` | Optional label; defaults to the zero-padded index |
| `eyebrow`     | `string` | Small uppercase category                          |
| `title`       | `string` | Card heading                                      |
| `description` | `string` | Body copy                                         |
| `image`       | `string` | Image URL                                         |
| `imageAlt`    | `string` | Image alt text                                    |
| `background`  | `string` | Card background color                             |
| `foreground`  | `string` | Optional text color (default `white`)             |

## Accessibility

- Every card is an `<article>` with a heading and real image alt text, so the content reads in order without the animation.
- The bobbing arrows are `aria-hidden`.
- With `prefers-reduced-motion: reduce`, cards fade out in place instead of folding, the scroll spring is skipped, and the arrows stop moving.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/case-study-flip-stack) by Harsh Jadhav.
