---
title: Visual Stepper
description: Auto-playing vertical stepper whose connector bar grows for the active step while a preview card crossfades per step.
---

::demo-visual-stepper
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/visual-stepper.json"
```

## Usage

```vue
<script setup lang="ts">
  import VisualStepper from '~/components/ui/visual-stepper/VisualStepper.vue';

  const steps = [
    { title: 'Pick a Skill', description: 'Choose a curated style' },
    { title: 'Copy Skill Expression', description: 'Customize & copy' },
    { title: 'Prompt in Codex', description: 'Type the visual you want' },
    { title: 'Use Visual Asset', description: 'App-ready asset is ready' },
  ];
</script>

<template>
  <VisualStepper v-model="activeStep" :steps="steps" autoplay>
    <template #card="{ index, step }">
      <!-- preview content per step -->
    </template>
  </VisualStepper>
</template>
```

Clicking a step jumps to it. `v-model` tracks the active index. The `#card`
slot receives `index` and `step` for rendering each step's preview panel.

## Props

| Prop             | Type                  | Default | Description                                |
| ---------------- | --------------------- | ------- | ------------------------------------------ |
| `steps`          | `VisualStepperStep[]` | —       | Ordered steps (`title`, `description?`)    |
| `v-model`        | `number`              | `0`     | Active step index                          |
| `autoplay`       | `boolean`             | `true`  | Auto-advance through steps                 |
| `interval`       | `number`              | `2500`  | Milliseconds each step stays active        |
| `pause-on-hover` | `boolean`             | `true`  | Pause autoplay while hovering              |
| `show-card`      | `boolean`             | `true`  | Render the crossfading preview card column |

## Events

| Event    | Payload  | Description              |
| -------- | -------- | ------------------------ |
| `change` | `number` | Fired on step activation |
