---
title: Staggered Menu
description: Side menu whose color layers slide in one after another, then the links rise into place with a staggered tilt while the toggle rolls from Menu to Close.
---

Click **Menu** to open: colored layers sweep in from the side one after another, the panel follows, and each link rises into place with a small tilt and its number fades in. Click **Close**, press Escape, pick a link or click outside to slide everything back.

::demo-staggered-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/staggered-menu.json"
```

## Usage

```vue
<script setup lang="ts">
  import { StaggeredMenu } from '~/components/ui/staggered-menu';
  import type { MenuItem, SocialItem } from '~/components/ui/staggered-menu';

  const items: MenuItem[] = [
    { label: 'Home', ariaLabel: 'Go to Home section', link: '#home' },
    { label: 'About', ariaLabel: 'Go to About section', link: '#about' },
    {
      label: 'Projects',
      ariaLabel: 'Go to Projects section',
      link: '#projects',
    },
    { label: 'Contact', ariaLabel: 'Go to Contact section', link: '#contact' },
  ];

  const socialItems: SocialItem[] = [
    { label: 'GitHub', link: 'https://github.com/your-handle' },
    { label: 'Twitter', link: 'https://twitter.com/your-handle' },
  ];
</script>

<template>
  <div class="relative h-screen bg-zinc-900">
    <StaggeredMenu
      position="right"
      :items="items"
      :social-items="socialItems"
      :colors="['#B497CF', '#5227FF']"
      logo-url="/logo.svg"
      menu-button-color="#fff"
      open-menu-button-color="#18181b"
      accent-color="#5227FF"
      @menu-open="console.log('open')"
      @menu-close="console.log('close')"
    />
  </div>
</template>
```

## Props

| Prop                        | Type                | Default                  | Description                                                                                             |
| --------------------------- | ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `position`                  | `'left' \| 'right'` | `'right'`                | Side the panel slides in from                                                                           |
| `colors`                    | `string[]`          | `['#B497CF', '#5227FF']` | Colors of the layers that sweep in before the panel (up to 4; with 3 or more the middle one is dropped) |
| `items`                     | `MenuItem[]`        | `[]`                     | Links in the panel (`label`, `link`, `ariaLabel?`)                                                      |
| `social-items`              | `SocialItem[]`      | `[]`                     | Social links at the bottom of the panel (`label`, `link`)                                               |
| `display-socials`           | `boolean`           | `true`                   | Show the social links                                                                                   |
| `display-item-numbering`    | `boolean`           | `true`                   | Show 01, 02… next to each link                                                                          |
| `logo-url`                  | `string`            | —                        | Logo image in the header. Inverted while open below 1024px                                              |
| `menu-button-color`         | `string`            | `'#fff'`                 | Toggle color while closed                                                                               |
| `open-menu-button-color`    | `string`            | `'#fff'`                 | Toggle color while open                                                                                 |
| `accent-color`              | `string`            | `'#5227FF'`              | Hover color for links, numbers and the socials title                                                    |
| `change-menu-color-on-open` | `boolean`           | `true`                   | Fade the toggle to `open-menu-button-color` when opening                                                |
| `is-fixed`                  | `boolean`           | `false`                  | Pin the menu to the viewport instead of its container                                                   |
| `close-on-click-away`       | `boolean`           | `true`                   | Close when clicking outside the panel                                                                   |
| `class`                     | `string`            | `''`                     | Extra classes for the wrapper                                                                           |

## Events

| Event        | Payload | Description                |
| ------------ | ------- | -------------------------- |
| `menu-open`  | —       | Fired when the menu opens  |
| `menu-close` | —       | Fired when the menu closes |

## Slots

| Slot   | Props               | Description                                       |
| ------ | ------------------- | ------------------------------------------------- |
| `logo` | `{ open: boolean }` | Custom header logo. Replaces the `logo-url` image |

## Accessibility

- The toggle is a real button with `aria-expanded`, `aria-controls` and an "Open menu" / "Close menu" label.
- While closed the panel is `inert` and `aria-hidden`, so its links are skipped by keyboard and screen readers.
- Escape closes the menu and returns focus to the toggle. Links and the toggle show visible focus rings.
- `prefers-reduced-motion: reduce` makes every transition instant.

- Ported from [React Bits](https://reactbits.dev/components/staggered-menu) by David Haz.
