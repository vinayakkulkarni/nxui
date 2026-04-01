---
title: Text String
description: A Verlet physics rope text animation where each character acts as a connected particle. Drag letters to unravel the string, toggle gravity, and watch characters collide and bounce.
---

::demo-text-string
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-string.json"
```

## Props

| Prop                  | Type     | Default                     | Description                                      |
| --------------------- | -------- | --------------------------- | ------------------------------------------------ |
| text                  | `string` | Alice in Wonderland excerpt | The text to display as a physics rope            |
| font-family           | `string` | `'Georgia'`                 | Font family for measurement and display          |
| font-size             | `number` | `20`                        | Font size in pixels                              |
| line-height           | `number` | `28`                        | Line height in pixels                            |
| damping               | `number` | `0.97`                      | Velocity damping factor (0-1)                    |
| gravity               | `number` | `0.15`                      | Gravity strength                                 |
| constraint-iterations | `number` | `12`                        | Number of constraint solver iterations per frame |
| collision-radius      | `number` | `7`                         | Collision detection radius per letter            |
| class                 | `string` | -                           | Additional CSS classes                           |
