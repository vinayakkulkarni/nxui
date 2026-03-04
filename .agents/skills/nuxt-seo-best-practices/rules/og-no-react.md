---
title: Use Plain JS Objects for Satori Elements, NEVER React
impact: CRITICAL
impactDescription: Prevents React dependency contamination in Vue projects
tags: og-image, satori, react, vue, element-helper
---

## Use Plain JS Objects for Satori Elements, NEVER React

Satori (the library that renders OG images) accepts plain JavaScript objects with `{ type, props }` shape. The `@cf-wasm/og` package exports an `html-to-react` utility, but **NEVER use it in Vue projects**. It imports React, which is a hard violation in Vue codebases. Instead, use a simple `el()` helper function.

**Incorrect (importing React utilities):**

```typescript
// ❌ WRONG — NEVER import React or React-related utilities in a Vue project
import { t } from '@cf-wasm/og/html-to-react';

export default defineEventHandler(async (event) => {
  // This pulls in React as a dependency — FORBIDDEN in Vue projects
  const element = t('<div style="display:flex">Hello</div>');
  // ...
});
```

**Correct (plain JS objects via el() helper):**

```typescript
// ✅ CORRECT — Plain JS objects, zero React dependency

// Satori element helper — creates { type, props } objects
// Satori requires display:flex on divs with 2+ children, and chokes on children:[]
function el(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const flat = children.flat().filter((c) => c != null && c !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
}

// Usage — composable like JSX but pure JS
const element = el(
  'div',
  { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' },
  el('div', { fontSize: '64px', fontWeight: 800, color: '#fafafa' }, 'Title'),
  el('div', { fontSize: '24px', color: '#a1a1aa' }, 'Description'),
);
// Output: { type: 'div', props: { style: {...}, children: [...] } }
```

**el() helper details:**

1. **`children.flat()`** — Allows passing arrays and nested elements
2. **`.filter(c => c != null && c !== false)`** — Enables conditional rendering like `...(condition ? [el(...)] : [])`
3. **Single string child** — `props.children = 'text'` (not wrapped in array)
4. **Multiple children** — `props.children = [child1, child2, ...]`
5. **No children** — `props` has no `children` key (Satori chokes on `children: []`)

**Conditional rendering pattern:**

```typescript
el(
  'div',
  { display: 'flex', flexDirection: 'column' },
  // Always shown
  el('div', { fontSize: '64px' }, title),
  // Conditionally shown
  ...(description
    ? [el('div', { fontSize: '24px', color: '#a1a1aa' }, description)]
    : []),
);
```

**HARD RULE: No React in Vue projects. Ever. Not even for OG image generation.**
