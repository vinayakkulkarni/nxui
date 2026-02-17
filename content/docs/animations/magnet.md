---
title: Magnet
description: Element that magnetically pulls toward the cursor when nearby.
---

::demo-magnet
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnet.json"
```

## Props

| Prop                  | Type      | Default                        | Description                                   |
| --------------------- | --------- | ------------------------------ | --------------------------------------------- |
| `padding`             | `number`  | `100`                          | Detection radius beyond element bounds        |
| `disabled`            | `boolean` | `false`                        | Disable the magnetic effect                   |
| `magnet-strength`     | `number`  | `2`                            | Divisor for movement (higher = less movement) |
| `active-transition`   | `string`  | `'transform 0.3s ease-out'`    | CSS transition when active                    |
| `inactive-transition` | `string`  | `'transform 0.5s ease-in-out'` | CSS transition when returning                 |
| `inner-class`         | `string`  | `''`                           | Class for the inner moving element            |
