---
title: Dynamic Island Header
description: Navbar that collapses into a compact pill on scroll, morphing to show the active section and reading progress.
---

::demo-dynamic-island-header
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dynamic-island-header.json"
```

## Usage

```vue
<script setup lang="ts">
  import DynamicIslandHeader from '~/components/ui/dynamic-island-header/DynamicIslandHeader.vue';

  const links = [
    { label: 'Programming', href: '#programming' },
    { label: 'Nutrition', href: '#nutrition' },
    { label: 'Pricing', href: '#pricing' },
  ];
</script>

<template>
  <div class="sticky top-4 z-50 flex justify-center px-4">
    <DynamicIslandHeader class="w-full max-w-3xl" :links="links" />
  </div>
</template>
```

Scroll past `threshold` and the full navbar springs into a compact island
showing the section currently in view plus a circular reading-progress
indicator. Anchor links (`#id`) are resolved against the scroll container.

Use the `#logo` and `#brand` slots to swap in your own mark and wordmark.
Pass a `container` element ref when the page scrolls inside a custom
scrollable element instead of the window.

## Props

| Prop            | Type                  | Default              | Description                                   |
| --------------- | --------------------- | -------------------- | --------------------------------------------- |
| `links`         | `DynamicIslandLink[]` | —                    | Nav links (`label`, `href` anchors)           |
| `threshold`     | `number`              | `80`                 | Scroll offset (px) that triggers the collapse |
| `compact-width` | `number`              | `260`                | Width (px) of the collapsed island            |
| `default-label` | `string`              | `'Overview'`         | Island label before any section is reached    |
| `sign-in-label` | `string`              | `'Sign in'`          | Sign-in text (empty string hides it)          |
| `cta-label`     | `string`              | `'Start free trial'` | CTA button text (empty string hides it)       |
| `container`     | `HTMLElement \| null` | `null`               | Scroll container (defaults to the window)     |

## Events

| Event      | Payload  | Description                             |
| ---------- | -------- | --------------------------------------- |
| `navigate` | `string` | Fired with the href on logo/link clicks |
