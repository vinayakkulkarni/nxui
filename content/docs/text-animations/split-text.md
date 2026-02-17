---
title: Split Text
description: Staggered character or word entrance animation triggered on scroll into view.
---

::demo-split-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/split-text.json"
```

## Props

| Prop        | Type                      | Default                 | Description                                    |
| ----------- | ------------------------- | ----------------------- | ---------------------------------------------- |
| `text`      | `string`                  | —                       | The text content to animate                    |
| `by`        | `'chars' \| 'words'`      | `'chars'`               | Split by individual characters or words        |
| `delay`     | `number`                  | `50`                    | Stagger delay between segments in milliseconds |
| `duration`  | `number`                  | `0.6`                   | Animation duration for each segment in seconds |
| `from`      | `Record<string, unknown>` | `{ opacity: 0, y: 40 }` | Initial animation state                        |
| `to`        | `Record<string, unknown>` | `{ opacity: 1, y: 0 }`  | Target animation state                         |
| `threshold` | `number`                  | `0.1`                   | Intersection observer threshold                |
| `class`     | `string`                  | —                       | Additional CSS classes                         |
