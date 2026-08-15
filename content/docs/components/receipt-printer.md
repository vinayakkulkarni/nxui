---
title: Receipt Printer
description: A checkout state that turns payment processing into a printed order receipt, with a stepped paper feed, a status screen and a serrated paper tear.
---

# Receipt Printer

A SaaS checkout state that turns payment processing into a printed order receipt.

The printer is a small compound component: a physical machine shell with a status screen on top, and a paper slot below where the receipt slides out — line by line for a stepped feed, or in one continuous pull. The status label and indicator swap between _Processing your order_, _Printing your receipt_ and _Order complete_ as the stage advances. Reduced-motion preferences are respected automatically.

::demo-receipt-printer
::

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ReceiptPrinter from '~/components/ui/receipt-printer/ReceiptPrinter.vue';
  import ReceiptPrinterMachine from '~/components/ui/receipt-printer/ReceiptPrinterMachine.vue';
  import ReceiptPrinterScreen from '~/components/ui/receipt-printer/ReceiptPrinterScreen.vue';
  import ReceiptPrinterStatus from '~/components/ui/receipt-printer/ReceiptPrinterStatus.vue';
  import ReceiptPrinterOutput from '~/components/ui/receipt-printer/ReceiptPrinterOutput.vue';
  import ReceiptPrinterPaper from '~/components/ui/receipt-printer/ReceiptPrinterPaper.vue';
  import type { ReceiptPrinterStage } from '~/components/ui/receipt-printer/types';

  const stage = ref<ReceiptPrinterStage>('printing');
</script>

<template>
  <ReceiptPrinter :stage="stage" feed-motion="stepped">
    <ReceiptPrinterMachine>
      <ReceiptPrinterScreen>
        <ReceiptPrinterStatus />
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>
    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper> your receipt content </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinter>
</template>
```

## Props

### ReceiptPrinter

| Prop          | Type                                       | Default             | Description                               |
| ------------- | ------------------------------------------ | ------------------- | ----------------------------------------- |
| `stage`       | `'processing' \| 'printing' \| 'complete'` | —                   | Current state of the printer              |
| `animate`     | `boolean`                                  | `true`              | Disables all stage transitions when false |
| `feed-motion` | `'smooth' \| 'stepped'`                    | `'stepped'`         | Continuous feed or one line at a time     |
| `aria-label`  | `string`                                   | `'Receipt printer'` | Accessible name of the section            |

`ReceiptPrinterStatus` accepts an optional `label` prop to override the stage-derived text.

## Events

The `stage` prop is the single source of truth — advance it on your own timers or backend state and the printer animates the rest.
