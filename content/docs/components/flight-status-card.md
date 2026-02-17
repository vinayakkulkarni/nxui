---
title: Flight Status Card
description: An animated card displaying real-time flight information with progress tracking.
---

::demo-flight-status-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flight-status-card.json"
```

## Props

| Prop     | Type         | Default  | Description                                               |
| -------- | ------------ | -------- | --------------------------------------------------------- |
| `flight` | `FlightInfo` | required | Flight information object with airline, route, and status |
| `class`  | `string`     | `''`     | Additional CSS classes for styling                        |
