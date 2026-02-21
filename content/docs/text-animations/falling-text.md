---
title: Falling Text
description: Matter.js physics-based falling text where words collapse and tumble with realistic gravity.
---

::demo-falling-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/falling-text.json"
```

## Props

| Prop                         | Type                                       | Default         | Description                     |
| ---------------------------- | ------------------------------------------ | --------------- | ------------------------------- |
| `text`                       | `string`                                   | `''`            | Text content to animate         |
| `highlight-words`            | `string[]`                                 | `[]`            | Words to highlight              |
| `highlight-class`            | `string`                                   | `'highlighted'` | CSS class for highlighted words |
| `trigger`                    | `'auto' \| 'scroll' \| 'click' \| 'hover'` | `'auto'`        | When to trigger the fall        |
| `background-color`           | `string`                                   | `'transparent'` | Canvas background color         |
| `wireframes`                 | `boolean`                                  | `false`         | Show physics wireframes         |
| `gravity`                    | `number`                                   | `1`             | Gravity strength                |
| `mouse-constraint-stiffness` | `number`                                   | `0.2`           | Mouse drag stiffness            |
| `font-size`                  | `string`                                   | `'1rem'`        | Text font size                  |
