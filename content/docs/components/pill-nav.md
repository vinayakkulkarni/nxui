---
title: Pill Nav
description: Responsive pill-shaped navigation with smooth sliding indicator and mobile hamburger menu.
---

::demo-pill-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pill-nav.json"
```

## Props

| Prop                      | Type        | Default     | Description                  |
| ------------------------- | ----------- | ----------- | ---------------------------- |
| `items`                   | `NavItem[]` | —           | Navigation items (required)  |
| `active-href`             | `string`    | `''`        | Currently active href        |
| `base-color`              | `string`    | `'#fff'`    | Base text/border color       |
| `pill-color`              | `string`    | `'#060010'` | Active pill background color |
| `hovered-pill-text-color` | `string`    | `'#060010'` | Text color when hovered      |
| `pill-text-color`         | `string`    | —           | Active pill text color       |

### NavItem

| Field       | Type     | Description     |
| ----------- | -------- | --------------- |
| `label`     | `string` | Display text    |
| `href`      | `string` | Link URL        |
| `ariaLabel` | `string` | Accessible name |
