---
title: Card Nav
description: Expandable navbar with staggered card reveal, hamburger toggle, and color-coded category panels.
---

::demo-card-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/card-nav.json"
```

## Props

| Prop              | Type          | Default    | Description                   |
| ----------------- | ------------- | ---------- | ----------------------------- |
| logo              | string        | ''         | Logo image URL                |
| logo-alt          | string        | 'Logo'     | Logo alt text                 |
| items             | CardNavItem[] | 3 defaults | Navigation card items (max 3) |
| base-color        | string        | '#ffffff'  | Nav background color          |
| menu-color        | string        | '#000000'  | Hamburger icon color          |
| button-bg-color   | string        | '#111111'  | CTA button background         |
| button-text-color | string        | '#ffffff'  | CTA button text color         |

## CardNavItem

| Prop      | Type          | Description           |
| --------- | ------------- | --------------------- |
| label     | string        | Category label        |
| bgColor   | string        | Card background color |
| textColor | string        | Card text color       |
| links     | CardNavLink[] | Array of link items   |

## CardNavLink

| Prop      | Type   | Description         |
| --------- | ------ | ------------------- |
| label     | string | Link text           |
| href      | string | Link URL            |
| ariaLabel | string | Accessibility label |
