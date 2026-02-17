---
title: Collection Surfer
description: A 3D scroll-driven collection viewer where items surf along a perspective track. Perfect for immersive showcases.
---

::demo-collection-surfer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/collection-surfer.json"
```

## Props

| Prop      | Type                                 | Default      | Description                                                                                       |
| --------- | ------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| `items`   | `CollectionSurferItem[]`             | `[]`         | Array of items with id, image URL, and title                                                      |
| `variant` | `'magnetic' \| 'uplift' \| 'simple'` | `'magnetic'` | Interaction style. Magnetic scales on hover, uplift moves vertically, simple has no hover effects |
| `class`   | `string`                             | `''`         | Additional CSS classes                                                                            |
