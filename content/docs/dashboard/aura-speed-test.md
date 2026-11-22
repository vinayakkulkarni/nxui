---
title: Aura Speed Test
description: A frosted-glass network speed test with a counting download figure, a live dot spectrum, upload and ping tiles, a packet-loss grid and a radar for the nearest server.
---

# Aura Speed Test

A speed test card stack in frosted glass over a violet aura. A run counts the download figure up from zero while the dot spectrum fills from left to right, then measures ping and upload, lights the packet-loss grid packet by packet and sweeps the radar faster. When the run settles, the status chip shows the result. The first run starts when the card scrolls into view; click the chip (or focus it and press Enter) to run again.

::demo-aura-speed-test
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aura-speed-test.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import AuraSpeedTest from '~/components/ui/aura-speed-test/AuraSpeedTest.vue';
  import type { AuraSpeedTestResult } from '~/components/ui/aura-speed-test/types';

  const meter = useTemplateRef<InstanceType<typeof AuraSpeedTest>>('meter');

  function onComplete(result: AuraSpeedTestResult): void {
    console.log(result.download, result.upload);
  }
</script>

<template>
  <AuraSpeedTest
    ref="meter"
    label="Home office / Wi-Fi 6"
    :download="912.3"
    :upload="204"
    :ping="9"
    :jitter="1.2"
    :packet-loss="2"
    server="PRG"
    distance="4 km"
    @complete="onComplete"
  />
  <button type="button" @click="meter?.run()">Test again</button>
</template>
```

The component animates toward the values you pass; it does not measure the network itself. Run your own test, then set the props and call `run()`.

## Props

| Prop            | Type      | Default                   | Description                                                |
| --------------- | --------- | ------------------------- | ---------------------------------------------------------- |
| `label`         | `string`  | `'Home office / Wi-Fi 6'` | Network name in the header.                                |
| `download`      | `number`  | `912.3`                   | Final download speed in Mbps.                              |
| `upload`        | `number`  | `204`                     | Final upload speed in Mbps.                                |
| `ping`          | `number`  | `9`                       | Final ping in ms.                                          |
| `jitter`        | `number`  | `1.2`                     | Jitter in ms, shown under the ping.                        |
| `packet-loss`   | `number`  | `2`                       | Packet loss in percent. Each lost percent is a gap.        |
| `upload-note`   | `string`  | `'+4% vs last week'`      | Note under the upload value.                               |
| `server`        | `string`  | `'PRG'`                   | Nearest server code.                                       |
| `distance`      | `string`  | `'4 km'`                  | Distance to the server.                                    |
| `duration`      | `number`  | `10000`                   | Length of one run in ms. The spectrum axis follows it.     |
| `auto-run`      | `boolean` | `true`                    | Starts a run the first time the card scrolls into view.    |
| `testing-label` | `string`  | `'Testing…'`              | Chip text during a run.                                    |
| `result-label`  | `string`  | `'Excellent'`             | Chip text after a run.                                     |
| `columns`       | `number`  | `38`                      | Number of spectrum columns.                                |
| `backdrop`      | `boolean` | `true`                    | Paints the violet aura stage. Set `false` to use your own. |
| `class`         | `string`  | `''`                      | Extra classes for the root element.                        |

## Events and methods

| Name             | Payload               | Description                                      |
| ---------------- | --------------------- | ------------------------------------------------ |
| `start` event    | —                     | Fires when a run starts.                         |
| `complete` event | `AuraSpeedTestResult` | Fires when a run settles, with the final values. |
| `run()` method   | —                     | Starts a run from zero.                          |

## Accessibility

- The status chip is a button. It has a visible focus ring and is disabled during a run.
- The animated figures are hidden from screen readers. A polite live region reads the result once a run settles.
- The run pauses while the card is off screen.
- With reduced motion, a run jumps straight to the result and the radar stops sweeping.
