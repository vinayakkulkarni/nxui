---
title: Editorial Orbs
description: Bouncing glowing orbs with text that dynamically flows around them in multi-column layout with drop caps and pull quotes.
---

::demo-editorial-orbs
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/editorial-orbs.json"
```

## Props

| Prop             | Type      | Default                    | Description               |
| ---------------- | --------- | -------------------------- | ------------------------- |
| text             | `string`  | `'Alice was beginning...'` | Body text content to flow |
| orb-count        | `number`  | `5`                        | Number of bouncing orbs   |
| show-drop-cap    | `boolean` | `true`                     | Show decorative drop cap  |
| show-pull-quotes | `boolean` | `true`                     | Show pull quote blocks    |
| class            | `string`  | `undefined`                | Additional CSS classes    |
