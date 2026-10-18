---
title: Testimonial Marquee
description: An infinite scrolling marquee of testimonial cards with smooth animation.
---

::demo-testimonial-marquee
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/testimonial-marquee.json"
```

## Usage

```vue
<script setup lang="ts">
  import TestimonialMarquee from '~/components/ui/testimonial-marquee/TestimonialMarquee.vue';

  const items = [
    {
      name: 'Sarah Chen',
      text: 'Amazing library!',
      avatar: '/avatars/sarah.jpg',
    },
    { name: 'Alex Morgan', text: 'Best DX ever.', avatar: '/avatars/alex.jpg' },
  ];
</script>

<template>
  <TestimonialMarquee :items="items" :speed="30" />
</template>
```

## Props

| Prop             | Type                | Default  | Description                          |
| ---------------- | ------------------- | -------- | ------------------------------------ |
| `pause-on-hover` | `boolean`           | `true`   | Pause animation when hovering        |
| `speed`          | `number`            | `40`     | Animation speed in pixels per second |
| `direction`      | `'left' \| 'right'` | `'left'` | Direction of marquee animation       |
| `class`          | `string`            | `''`     | Additional CSS classes for styling   |
