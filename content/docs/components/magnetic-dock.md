---
title: Magnetic Dock
description: A macOS-style dock with magnetic hover magnification and genie effect.
---

::demo-magnetic-dock
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnetic-dock.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `DockItem[]` | `[]` | Array of dock items with icon and label |
| `magnification` | `number` | `1.5` | Magnification factor on hover |
| `distance` | `number` | `150` | Distance for magnetic effect in pixels |
| `class` | `string` | `''` | Additional CSS classes for styling |
