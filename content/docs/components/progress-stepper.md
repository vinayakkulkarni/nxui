---
title: Progress Stepper
description: A vertical process timeline with a single rail, spinning in-progress markers, drawn-in checks and nested sub-steps that unfold under the active step.
---

# Progress Stepper

A vertical timeline for long-running work, such as an agent run or a deployment. Labels sit on one side of a single rail. Each marker shows its state: a green check for done, a spinning blue arc for in progress, and a dashed circle for not started. Sub-steps unfold under the active step and fold away when it completes. Hover the demo to pause the autoplay.

::demo-progress-stepper
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/progress-stepper.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ProgressStepper from '~/components/ui/progress-stepper/ProgressStepper.vue';
  import type { ProgressStep } from '~/components/ui/progress-stepper/types';

  const steps: ProgressStep[] = [
    { id: 'plan', title: 'Resolution Planning' },
    {
      id: 'implement',
      title: 'Implementation',
      children: [
        { id: 'configure', title: 'Configure Solution' },
        { id: 'apply', title: 'Apply Changes' },
      ],
    },
    { id: 'summary', title: 'Final Summary' },
  ];

  const current = ref(1);
  const currentChild = ref(0);
</script>

<template>
  <ProgressStepper
    v-model:current="current"
    v-model:current-child="currentChild"
    :steps="steps"
  />
</template>
```

Statuses come from `current` and `current-child` by default. Set `status` on a step or sub-step to override them, for example to show a step that was skipped.

## Props

| Prop              | Type                | Default   | Description                                                                |
| ----------------- | ------------------- | --------- | -------------------------------------------------------------------------- |
| `steps`           | `ProgressStep[]`    | —         | Top-level steps. Each step can have `children` sub-steps.                  |
| `current`         | `number`            | `0`       | `v-model`. Index of the active step. `steps.length` marks every step done. |
| `current-child`   | `number`            | `0`       | `v-model`. Index of the active sub-step inside the active step.            |
| `align`           | `'right' \| 'left'` | `'right'` | `right` puts labels left of the rail. `left` puts them right of the rail.  |
| `show-step-label` | `boolean`           | `true`    | Shows "Step N" under steps that have no `description`.                     |
| `class`           | `string`            | `''`      | Extra classes for the root list.                                           |

## Slots

| Slot          | Props      | Description                                |
| ------------- | ---------- | ------------------------------------------ |
| `title`       | `{ step }` | Replaces a top-level step title.           |
| `description` | `{ step }` | Replaces the line under a top-level title. |

## Accessibility

- Renders an ordered list. The active step and sub-step get `aria-current="step"`.
- Each step announces its state as "completed", "in progress" or "not started".
- The spinner and the check animation stop when the user prefers reduced motion.
