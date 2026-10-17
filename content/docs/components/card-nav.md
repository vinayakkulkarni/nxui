---
title: Card Nav
description: A navigation bar that springs open into a row of cards, each with its own links.
---

A navigation bar that springs open into a row of cards, each with its own links. Click Menu (or hover the bar with `open-on="hover"`) and the bar grows; the cards rise, unfold or fade in one after another. Link arrows slide on hover. Below 560px the cards stack and the button moves to the bottom of the menu.

::demo-card-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/card-nav.json"
```

## Usage

```vue
<script setup lang="ts">
  import { CardNav } from '~/components/ui/card-nav';
  import type { CardNavItem } from '~/components/ui/card-nav';

  const items: CardNavItem[] = [
    {
      label: 'About',
      description: 'The people and the story behind the studio.',
      links: [
        { label: 'Company', href: '/company' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      label: 'Contact',
      bgColor: '#ff5a1f',
      textColor: '#121016',
      links: [{ label: 'Email', href: 'mailto:hi@acme.dev' }],
    },
  ];
</script>

<template>
  <CardNav
    logo="/logo.svg"
    logo-alt="Acme"
    :items="items"
    :cta="{ label: 'Get started', href: '/signup' }"
    :link-component="NuxtLink"
    card-effect="unfold"
  />
</template>
```

Use the `logo` slot instead of the `logo` prop to render your own mark. Pass `v-model:open` to control the menu from outside.

## Props

| Prop             | Type                           | Default        | Description                                                                        |
| ---------------- | ------------------------------ | -------------- | ---------------------------------------------------------------------------------- |
| `items`          | `CardNavItem[]`                | 3 sample cards | The cards. `label`, `description?`, `bgColor?`, `textColor?`, `links?`.            |
| `logo`           | `string`                       | `''`           | Image URL shown in the middle of the bar.                                          |
| `logo-alt`       | `string`                       | `'Logo'`       | Accessible label for the logo link.                                                |
| `logo-href`      | `string`                       | `'#'`          | Where the logo links to.                                                           |
| `cta`            | `CardNavCta`                   | —              | Button on the right (`label`, `href?`, `onClick?`). Moves to the menu when narrow. |
| `theme`          | `'dark' \| 'light'`            | `'dark'`       | Color scheme of the bar, cards and button.                                         |
| `surface`        | `'glass' \| 'solid'`           | `'glass'`      | Frosted glass that blurs what is behind, or an opaque fill.                        |
| `open-on`        | `'click' \| 'hover'`           | `'click'`      | Opens from the button, or as soon as the pointer moves over the bar.               |
| `card-effect`    | `'rise' \| 'unfold' \| 'fade'` | `'rise'`       | How the cards arrive: rising, folding down from the bar, or fading in from a blur. |
| `stagger`        | `number`                       | `0.12`         | How far each card trails the one before it, from 0 to 0.3.                         |
| `bounce`         | `number`                       | `0.2`          | How much the menu overshoots as it opens, from 0 to 1.                             |
| `speed`          | `number`                       | `1`            | Speed of the open and close animation.                                             |
| `card-height`    | `number`                       | `176`          | Minimum card height, in px.                                                        |
| `max-width`      | `number`                       | `800`          | Maximum width of the bar, in px.                                                   |
| `accent-color`   | `string`                       | —              | Button color. Its label picks black or white for contrast.                         |
| `menu-label`     | `boolean`                      | `true`         | Shows Menu / Close next to the icon, rolling between them.                         |
| `intro`          | `boolean`                      | `true`         | Unrolls the bar from its center on mount.                                          |
| `default-open`   | `boolean`                      | `false`        | Starts with the menu open.                                                         |
| `open`           | `boolean`                      | —              | Controlled open state. Use with `v-model:open`.                                    |
| `link-component` | `string \| Component`          | `'a'`          | Renders links, e.g. `NuxtLink`. Receives `href`. Links without `href` are buttons. |
| `aria-label`     | `string`                       | `'Main'`       | Accessible name of the nav landmark.                                               |
| `class`          | `string`                       | `''`           | Extra classes for the root.                                                        |

## Events / Slots

| API           | Payload                                                   | Description                                          |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `update:open` | `open: boolean`                                           | The menu opened or closed.                           |
| `link-click`  | `link: CardNavLink, item: CardNavItem, event: MouseEvent` | A card link was clicked. The menu closes afterwards. |
| `#logo`       | —                                                         | Custom logo markup in place of the `logo` image.     |

## Accessibility

- The bar is a `<nav>` landmark. The menu button sets `aria-expanded` and `aria-controls`; the card area is `aria-hidden` and its links leave the tab order while closed.
- Escape closes the menu and returns focus to the menu button. A pointer press outside closes it too.
- With `menu-label` off, the button gets an `aria-label` of "Open menu" / "Close menu".
- With `prefers-reduced-motion: reduce`, the menu opens without a spring, the intro is skipped and the icon and arrow transitions are off.

- Ported from [React Bits](https://reactbits.dev/components/card-nav) by David Haz.
