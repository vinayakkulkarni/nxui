---
title: Typographic Particles
description: Particle physics simulation rendered as proportional ASCII art with brightness-matched character selection.
---

::demo-typographic-particles
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/typographic-particles.json"
```

## Props

| Prop           | Type     | Default     | Description                    |
| -------------- | -------- | ----------- | ------------------------------ |
| text           | `string` | `'NXUI'`    | Text content for ASCII display |
| cols           | `number` | `50`        | Grid columns                   |
| rows           | `number` | `28`        | Grid rows                      |
| font-size      | `number` | `14`        | Font size in pixels            |
| particle-count | `number` | `120`       | Number of physics particles    |
| class          | `string` | `undefined` | Additional CSS classes         |
