---
title: Stepper
description: A multi-step flow in a frosted panel, with a gliding step indicator, spring transitions and number, dot, bar or vertical layouts.
---

A multi-step flow in a frosted panel. Click Continue or Back, or click a step in the indicator row to jump to it. A tile glides to the current step, finished steps get a drawn check, the content slides between steps and the panel height springs to fit. Steps can have a title, a description and an icon. Choose numbers, dots or bars across the top, or a vertical rail beside the content. In the demo the Continue button stays disabled on the Profile step until you type a name.

::demo-stepper
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stepper.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import Stepper from '~/components/ui/stepper/Stepper.vue';
  import StepperStep from '~/components/ui/stepper/StepperStep.vue';

  const step = ref(1);
  const name = ref('');
</script>

<template>
  <Stepper
    v-model:step="step"
    :next-button-props="{ disabled: step === 2 && !name }"
    @final-step-completed="console.log('done')"
  >
    <StepperStep title="Welcome">
      <h3>Welcome aboard</h3>
    </StepperStep>
    <StepperStep title="Profile">
      <input v-model="name" placeholder="Your name" />
    </StepperStep>
    <StepperStep title="Review">
      <h3>Looking good, {{ name }}</h3>
    </StepperStep>

    <template #completed>
      <h3>Workspace ready</h3>
    </template>
  </Stepper>

  <!-- Vertical rail with icons and descriptions -->
  <Stepper orientation="vertical" :width="640" accent-color="#4763eb">
    <StepperStep title="Cart" description="2 items" icon="lucide:shopping-cart">
      …
    </StepperStep>
    <StepperStep
      title="Shipping"
      description="Delivery speed"
      icon="lucide:truck"
    >
      …
    </StepperStep>
  </Stepper>
</template>
```

Inside the panel, the CSS variables `--stepper-ink`, `--stepper-muted`, `--stepper-well`, `--stepper-tile`, `--stepper-tile-edge` and `--stepper-ring` are available, so your step content can match the theme. The vertical rail folds into a row when the stepper is narrower than 520px, and step titles hide when the row cannot fit them.

## Props

| Prop                      | Type                            | Default        | Description                                                                                             |
| ------------------------- | ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `v-model:step`            | `number`                        | —              | The current step. Leave it unbound to let the stepper keep its own step.                                |
| `initial-step`            | `number`                        | `1`            | The step shown first when `v-model:step` is not used.                                                   |
| `indicator`               | `'numbers' \| 'dots' \| 'bars'` | `'numbers'`    | Style of the step indicators in the horizontal layout.                                                  |
| `orientation`             | `'horizontal' \| 'vertical'`    | `'horizontal'` | Indicators across the top, or a rail of numbered steps beside the content.                              |
| `transition`              | `'slide' \| 'fade' \| 'none'`   | `'slide'`      | How the content changes between steps. The height always animates.                                      |
| `linear`                  | `boolean`                       | `false`        | Only lets the indicators jump back to steps that have been reached.                                     |
| `disable-step-indicators` | `boolean`                       | `false`        | Stops the indicators from changing the step when clicked.                                               |
| `show-footer`             | `boolean`                       | `true`         | Shows the Back and Continue buttons.                                                                    |
| `back-button-text`        | `string`                        | `'Back'`       | Text of the Back button.                                                                                |
| `next-button-text`        | `string`                        | `'Continue'`   | Text of the Continue button.                                                                            |
| `complete-button-text`    | `string`                        | `'Complete'`   | Text of the Continue button on the last step.                                                           |
| `back-button-props`       | `ButtonHTMLAttributes`          | `{}`           | Extra attributes for the Back button. An `onClick` that calls `preventDefault()` stops the step change. |
| `next-button-props`       | `ButtonHTMLAttributes`          | `{}`           | Extra attributes for the Continue button, such as `{ disabled: true }` while a step is incomplete.      |
| `theme`                   | `'dark' \| 'light'`             | `'dark'`       | Color theme of the panel and controls.                                                                  |
| `accent-color`            | `string`                        | —              | Color of finished steps, the bars and the Continue button. Its text color is picked for contrast.       |
| `frame`                   | `boolean`                       | `true`         | Shows the frosted panel around the stepper.                                                             |
| `radius`                  | `number`                        | `24`           | Corner radius of the panel, in px.                                                                      |
| `width`                   | `number \| string`              | `440`          | Maximum width of the stepper.                                                                           |
| `class`                   | `string`                        | `''`           | Extra classes on the root.                                                                              |
| `step-container-class`    | `string`                        | `''`           | Extra classes on the indicator row.                                                                     |
| `content-class`           | `string`                        | `''`           | Extra classes on the content area.                                                                      |
| `footer-class`            | `string`                        | `''`           | Extra classes on the footer.                                                                            |

### StepperStep props

| Prop          | Type     | Default | Description                                                            |
| ------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `title`       | `string` | —       | Label shown in the indicator row, or beside it in the vertical layout. |
| `description` | `string` | —       | Second line shown beside the indicator in the vertical layout.         |
| `icon`        | `string` | —       | Iconify name (e.g. `lucide:truck`) shown instead of the step number.   |

## Events and slots

| Name                         | Payload / props                              | Description                                                 |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `step-change` event          | `step: number`                               | Fires when the step changes.                                |
| `final-step-completed` event | —                                            | Fires when the last step is completed.                      |
| `default` slot               | —                                            | The steps, one `StepperStep` each.                          |
| `#completed` slot            | —                                            | Shown in place of the steps once the last one is completed. |
| `#indicator` slot            | `{ step, currentStep, status, onStepClick }` | Replaces the numbered badge with your own indicator.        |

## Accessibility

- The indicators are buttons with `aria-label="Step N: Title"` and `aria-current="step"` on the current one. Steps that cannot be reached are disabled.
- The content area is an `aria-live` region, so the new step is announced. If focus was inside the old step, it moves to the new one.
- Buttons and indicators show a visible focus ring.
- With `prefers-reduced-motion: reduce`, the content fades instead of sliding and the glider jumps instead of springing.

- Ported from [React Bits](https://reactbits.dev/components/stepper) by David Haz.
