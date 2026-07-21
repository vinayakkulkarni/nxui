---
title: Build Satori Element Trees Without the React Runtime
impact: CRITICAL
impactDescription: Avoids pulling the React runtime into a Vue project for OG generation
tags: og-image, satori, react, vue, element-helper
---

## Build Satori Element Trees Without the React Runtime

Satori renders OG images from **React-elements-like objects** — plain objects shaped `{ type, props: { style, children } }`. That element data model IS Satori's API and is unavoidable; the objects are React-element-_shaped_ by design. The thing to avoid in a Vue project is the React **runtime/package** dependency, not React's element shape.

Concretely: `@cf-wasm/og` ships an `html-to-react` utility whose `t()` parser pulls in React. Don't use it in a Vue codebase — it adds React as a real dependency. Instead, construct the same `{ type, props }` objects yourself with a tiny `el()` helper (no React import).

> If you prefer JSX ergonomics without React, Satori also ships an experimental `satori/jsx` JSX runtime — an officially-sanctioned alternative that needs no React package.

**Incorrect (importing React utilities):**

```typescript
// ❌ WRONG — html-to-react's t() pulls the React runtime into a Vue project
import { t } from '@cf-wasm/og/html-to-react';

export default defineEventHandler(async (event) => {
  // t() imports React — avoid this dependency in a Vue codebase
  const element = t('<div style="display:flex">Hello</div>');
  // ...
});
```

**Correct (plain JS objects via el() helper):**

```typescript
// ✅ CORRECT — Plain JS objects, zero React dependency

// Satori element helper — creates { type, props } objects (React-element-shaped, no React)
// Satori defaults `display` to flex; just don't override multi-child divs to a
// non-flex value. It also chokes on children:[]
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

**RULE: In a Vue project, don't add the React runtime for OG generation.** The `{ type, props }` element objects Satori consumes are React-element-shaped — that's Satori's API, not a React dependency. Build them with `el()` (or `satori/jsx`), and avoid `html-to-react`'s `t()`, which imports React.
