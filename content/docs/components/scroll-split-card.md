---
title: Scroll Split Card
description: Scroll-driven card that splits into 3 panels and flips to reveal content.
---

::demo-scroll-split-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-split-card.json"
```

## Props

| Prop        | Type                    | Default             | Description                    |
| ----------- | ----------------------- | ------------------- | ------------------------------ |
| `imageSrc`  | `string`                | —                   | URL of the hero image to split |
| `cards`     | `ScrollSplitCardItem[]` | —                   | Array of card content (max 3)  |
| `startHint` | `string`                | `'Scroll down'`     | Text shown at scroll start     |
| `endHint`   | `string`                | `'So cool, right?'` | Text shown at scroll end       |
| `class`     | `string`                | —                   | Additional CSS classes         |

## ScrollSplitCardItem

| Prop          | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `title`       | `string` | Card back-side heading             |
| `description` | `string` | Card back-side description text    |
| `bgColor`     | `string` | CSS background color for back side |
| `textColor`   | `string` | CSS text color for back side       |

## Slots

| Slot       | Props       | Description                     |
| ---------- | ----------- | ------------------------------- |
| `icon-{i}` | `{ index }` | Icon slot for card back (i=0-2) |

## Behavior

The component unfolds in three scroll-driven stages:

1. **Stage 1 (0–40%)** — Cards separate horizontally, scale down to 0.9, and borders animate from sharp to rounded
2. **Stage 2 (40–80%)** — Cards flip on the Y-axis with a subtle Z-axis tilt
3. **Stage 3 (80–100%)** — Cards lift up (-200px) and the back-side content text fades in

The component uses a spring-physics smoothing on scroll progress for fluid animation.
