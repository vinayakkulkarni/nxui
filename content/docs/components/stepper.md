---
title: Stepper
description: Multi-step wizard with animated step indicators and slide transitions.
---

::demo-stepper
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stepper.json"
```

## Props

| Prop                      | Type      | Default      | Description                      |
| ------------------------- | --------- | ------------ | -------------------------------- |
| `initial-step`            | `number`  | `1`          | Starting step number             |
| `back-button-text`        | `string`  | `'Back'`     | Back button label                |
| `next-button-text`        | `string`  | `'Continue'` | Next button label                |
| `disable-step-indicators` | `boolean` | `false`      | Disable clicking step indicators |

## Events

| Event                  | Payload  | Description                         |
| ---------------------- | -------- | ----------------------------------- |
| `step-change`          | `number` | Emitted when step changes           |
| `final-step-completed` | —        | Emitted when last step is completed |
