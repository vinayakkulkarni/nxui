---
title: Showcase Card
description: A card with 3D tilt effect that responds to mouse movement for showcasing content.
---

::demo-showcase-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/showcase-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShowcaseCard from '~/components/ui/showcase-card/ShowcaseCard.vue';
</script>

<template>
  <ShowcaseCard
    tagline="Work fast. Live slow."
    heading="Create your digital reality."
    description="From nothing to everything."
    image-url="/images/showcase.jpg"
    cta-text="Send a message"
  />
</template>
```

## Props

| Prop    | Type     | Default | Description                        |
| ------- | -------- | ------- | ---------------------------------- |
| `class` | `string` | `''`    | Additional CSS classes for styling |
