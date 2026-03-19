# CLAUDE.md - nxui Development Guide

> **For AI Assistants (Claude Code, Cursor, etc.)**
> This is the single source of truth for the nxui project. When this file conflicts with `.agents/skills/`, **this file wins**.

---

## Quick Reference

```bash
bun install            # Install dependencies
bun run dev            # Start dev server (localhost:3000)
bun run build          # Production build (Cloudflare Pages)
bun run lint           # Run oxlint
bun run lint:fix       # Fix lint issues
bun run format         # Format with oxfmt
bun run format:check   # Check formatting
bun run build:registry # Build registry JSONs → public/r/
```

---

## Project Overview

**nxui** is an exact Vue port of [componentry.fun](https://www.componentry.fun) — a beautiful animated UI component library. Users copy, paste, and ship animated components via the `shadcn-vue` CLI.

- **Domain**: `nxui.geoql.in` (NOT nxui.dev)
- **Port target**: React/Framer Motion → Vue 3/motion-v
- **Deploy**: Cloudflare Pages with D1 database for content

---

## Tech Stack

| Layer           | Technology                                       | Version                                                           |
| --------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Framework       | Nuxt 4                                           | v4.4.2 (`future.compatibilityVersion: 4`)                         |
| UI              | Vue 3 Composition API                            | v3.5+                                                             |
| Styling         | Tailwind CSS v4                                  | `@nuxtjs/tailwindcss` v7 (wraps `@tailwindcss/vite` — no PostCSS) |
| Animation       | motion-v                                         | v2.0.1 (Vue Framer Motion equivalent)                             |
| Utilities       | VueUse                                           | v14.2.1                                                           |
| Content         | @nuxt/content                                    | v3                                                                |
| Icons           | @nuxt/icon (Iconify)                             | v2.2.1 (lucide:\_, simple-icons:\_)                               |
| Color Mode      | @nuxtjs/color-mode                               | v4                                                                |
| Headless UI     | reka-ui                                          | v2.9.2                                                            |
| Highlighting    | shiki                                            | v4.0.2                                                            |
| Class Utils     | class-variance-authority + clsx + tailwind-merge |                                                                   |
| Types           | TypeScript                                       | v5.8+ strict                                                      |
| Package Manager | Bun                                              | v1.3.10                                                           |

---

## Project Structure

```
nxui/
├── CLAUDE.md                          # THIS FILE
├── nuxt.config.ts                     # Nuxt config
├── package.json
├── app/
│   ├── assets/css/main.css            # Tailwind v4 + oklch CSS vars
│   ├── components/
│   │   ├── content/                   # Demo wrappers (ComponentDemo, Demo*.vue)
│   │   ├── docs/                      # Docs layout components
│   │   └── ui/                        # Shadcn-vue base components
│   ├── composables/                   # Vue composables (kebab-case files)
│   ├── layouts/                       # Nuxt layouts (docs.vue)
│   ├── lib/utils.ts                   # cn() utility
│   ├── pages/                         # File-based routing
│   └── types/                         # ALL types live here
│       └── components.ts              # Component interfaces
├── registry/
│   └── new-york/                      # Registry components (NOT auto-imported)
│       ├── ShimmerButton/
│       │   └── ShimmerButton.vue
│       ├── NodeDiagram/
│       │   ├── NodeDiagram.vue
│       │   ├── NodeDiagramNode.vue
│       │   └── NodeDiagramTrace.vue
│       └── ...
├── content/                           # @nuxt/content markdown
│   ├── docs/components/               # Component doc pages
│   └── 3.components/                  # Numbered component pages
├── public/r/                          # Built registry JSON files
├── scripts/build-registry.ts          # Registry build script
└── .agents/skills/                    # AI skills (supplementary)
```

---

## Critical Rules

### Rule 1: Types NEVER Inline

NEVER define `interface` or `type` inside `.vue` files or composables. ALL types go in `app/types/`.

```typescript
// ❌ WRONG — inside a .vue file
interface MyProps {
  name: string;
}

// ✅ CORRECT — in app/types/components.ts
export interface MyProps {
  name: string;
}
// Import: import type { MyProps } from '~/types/components';
```

### Rule 2: No `any` — Ever

Use `unknown` with type guards. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.

### Rule 3: Vue 3 Composition API Only

Always `<script setup lang="ts">`. Never Options API. Never `defineComponent()`.

### Rule 4: `size-*` for Square Elements

```vue
<!-- ❌ -->
<Icon class="w-4 h-4" />
<!-- ✅ -->
<Icon class="size-4" />
```

### Rule 5: @nuxt/icon — No Inline SVGs

```vue
<!-- ❌ -->
<svg>...</svg>
<!-- ✅ -->
<Icon name="lucide:check" class="size-4" />
```

### Rule 6: Vue Components Under 100 Lines

Exception: registry components (self-contained). Extract sub-components or composables when too large.

### Rule 7: No Inline Arrow Functions with Multiple Params in Templates

```vue
<!-- ❌ -->
@click="(a, b) => doThing(a, b)"
<!-- ✅ -->
@click="handleClick"
```

### Rule 8: No Inline `import()` in Type Annotations

```typescript
// ❌ errorCode?: import('~/types/embed').EmbedErrorCode
// ✅ import type { EmbedErrorCode } from '~/types/embed';
```

### Rule 9: Composable Naming

kebab-case files, camelCase exports: `use-sidebar.ts` → `useSidebar()`.

### Rule 10: Use VueUse Extensively

Prefer VueUse over manual implementations: `useEventListener`, `useMediaQuery`, `useResizeObserver`, `useRafFn`, `useMouseInElement`, `useClipboard`, etc.

### Rule 11: Tailwind v4 oklch — NOT hsl

```css
/* ❌ WRONG */
background: hsl(var(--primary));
/* ✅ CORRECT */
background: var(--primary);
```

Dark mode uses oklch with hue 270. Dark variant: `@custom-variant dark (&:is(.dark *));`

### Rule 12: Registry Components — Explicit Imports

Components in `registry/new-york/` are NOT auto-imported by Nuxt. Sub-components MUST use explicit relative imports.

```typescript
// Inside registry/new-york/NodeDiagram/NodeDiagram.vue:
import NodeDiagramNode from './NodeDiagramNode.vue'; // ✅ Explicit
```

### Rule 13: ComponentDemo Wrapper

All demo components use `<ComponentDemo>`. Pass a `code` prop for the two-part card (live demo + collapsible source code). Without `code`, renders as simple demo wrapper.

### Rule 14: Faithful Ports from componentry.fun

This is an EXACT replica of componentry.fun but for Vue. Port React/Framer Motion → Vue/motion-v. No React.

### Rule 15: kebab-case Props in Templates

Always use kebab-case for multi-word props in `<template>` and in `code` snippet strings shown to users. Vue auto-maps kebab-case to camelCase props.

```vue
<!-- ❌ WRONG -->
<ClosingPlasma darkColorA="#0a0a1e" />
<WebGLLiquid colorDeep="#020b06" colorMid="#065f46" />

<!-- ✅ CORRECT -->
<ClosingPlasma dark-color-a="#0a0a1e" />
<WebGLLiquid color-deep="#020b06" color-mid="#065f46" />
```

This applies everywhere: live `<template>` usage, `code` prop strings in demos, and documentation examples. `defineProps` in `<script setup>` stays camelCase — only the template/HTML side uses kebab-case.

---

## CSS & Styling

### Tailwind v4 Setup

- Configured via `@nuxtjs/tailwindcss` v7 (wraps `@tailwindcss/vite` internally — NOT PostCSS)
- Main CSS: `app/assets/css/main.css`
- Registry scanning: `@source "../../../registry";`
- Dark variant: `@custom-variant dark (&:is(.dark *));`

### Color System (oklch)

Light mode: neutral oklch (no hue). Dark mode: oklch with hue 270 (purple tint).

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
}
.dark {
  --background: oklch(0.13 0.004 270);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
}
```

### Theme Bridge

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* Maps CSS vars → Tailwind color tokens */
}
```

---

## Registry Architecture

Each registry component: `registry/new-york/ComponentName/`

- Main file: `ComponentName.vue`
- Sub-components: `ComponentNamePart.vue`
- Types: imported from `~/types/components`

The `@registry` alias maps to `../registry` (set in `nuxt.config.ts`).

Build: `bun run scripts/build-registry.ts` → generates `public/r/*.json` for `shadcn-vue` CLI.

---

## motion-v Patterns

```vue
<script setup lang="ts">
  import { motion } from 'motion-v';
</script>

<template>
  <component
    :is="motion.div"
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5, type: 'spring', stiffness: 300, damping: 30 }"
  >
    Content
  </component>
</template>
```

- Stagger children: `{ delay: index * 0.1 }`
- Spring: `{ type: 'spring', stiffness: 300, damping: 30 }`
- Exit: `:exit="{ opacity: 0 }"` (with `AnimatePresence`)

---

## Performance

- Prefer `transform` and `opacity` for GPU-accelerated animations
- Use `will-change` sparingly (only during active animation)
- Canvas animations: `useRafFn` from VueUse
- Clear with `rgba(0,0,0,0.1)` overlay, not `clearRect` (for trail effects)
- Stagger entry animations for lists/grids

---

## Laws of UX

Design principles to follow when building components and interactions.

| #   | Law                              | Description                                                                        |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | **Aesthetic-Usability Effect**   | Users perceive aesthetically pleasing design as more usable                        |
| 2   | **Choice Overload**              | People get overwhelmed with too many options                                       |
| 3   | **Chunking**                     | Break information into meaningful groups                                           |
| 4   | **Cognitive Bias**               | Systematic errors in thinking influence perception and decisions                   |
| 5   | **Cognitive Load**               | Minimize mental resources needed to interact with an interface                     |
| 6   | **Doherty Threshold**            | Keep interactions under 400ms so neither user nor system waits                     |
| 7   | **Fitts's Law**                  | Time to reach a target depends on distance and size — make targets large and close |
| 8   | **Flow**                         | Design for full immersion — minimize interruptions                                 |
| 9   | **Goal-Gradient Effect**         | Motivation increases with proximity to a goal — show progress                      |
| 10  | **Hick's Law**                   | Decision time increases with number and complexity of choices                      |
| 11  | **Jakob's Law**                  | Users prefer your site to work like sites they already know                        |
| 12  | **Law of Common Region**         | Elements sharing a boundary are perceived as grouped                               |
| 13  | **Law of Proximity**             | Objects near each other are perceived as grouped                                   |
| 14  | **Law of Prägnanz**              | People interpret complex images as the simplest form possible                      |
| 15  | **Law of Similarity**            | Similar elements are perceived as a group                                          |
| 16  | **Law of Uniform Connectedness** | Visually connected elements are perceived as more related                          |
| 17  | **Mental Model**                 | Users carry expectations about how systems work                                    |
| 18  | **Miller's Law**                 | Working memory holds 7 (±2) items — chunk information accordingly                  |
| 19  | **Occam's Razor**                | Prefer the simplest solution with fewest assumptions                               |
| 20  | **Paradox of the Active User**   | Users never read manuals — they start using immediately                            |
| 21  | **Pareto Principle**             | 80% of effects come from 20% of causes — focus on high-impact work                 |
| 22  | **Parkinson's Law**              | Tasks expand to fill available time — set constraints                              |
| 23  | **Peak-End Rule**                | Experiences are judged by their peak moment and ending                             |
| 24  | **Postel's Law**                 | Be liberal in what you accept, conservative in what you send                       |
| 25  | **Selective Attention**          | Users focus on stimuli related to their goals                                      |
| 26  | **Serial Position Effect**       | First and last items in a series are remembered best                               |
| 27  | **Tesler's Law**                 | Every system has irreducible complexity — put it in the right place                |
| 28  | **Von Restorff Effect**          | The item that differs from the rest is most memorable                              |
| 29  | **Working Memory**               | Cognitive system that temporarily holds info for tasks                             |
| 30  | **Zeigarnik Effect**             | Incomplete tasks are remembered better than complete ones                          |

---

## Practical Typography

From Butterick's Practical Typography — rules for the docs site.

### Core Rules

| Rule             | Guideline                                           |
| ---------------- | --------------------------------------------------- |
| Body text size   | 19–22px for web, 1.4–1.6 line height                |
| Line length      | 45–90 characters per line (2–3 lowercase alphabets) |
| Quotes           | Curly quotes, not straight                          |
| Sentence spacing | One space between sentences, not two                |
| Underlining      | Only for links — never for emphasis                 |

### Web Typography

| Rule           | Guideline                                                  |
| -------------- | ---------------------------------------------------------- |
| Font families  | Max 2 families (system stack or well-chosen web fonts)     |
| Minimum size   | Body text never smaller than 16px                          |
| Alignment      | Left-align body text — avoid centered body text            |
| Emphasis       | Bold or italic, not ALL CAPS                               |
| Contrast       | Sufficient contrast between text and background            |
| Headings       | Visually distinct via size/weight, not just bold           |
| Paragraphs     | Use either indents OR space between — not both             |
| Letter-spacing | Don't letterspace lowercase text                           |
| Tables         | Minimize borders; numbers right-aligned, text left-aligned |
| Color          | Use sparingly for semantics, not decoration                |
| Max line width | ~80 characters                                             |

---

## Skills Integration

This project uses the following skills in `.agents/skills/`:

**Development:**

- `vue-best-practices/` — Vue 3 performance optimization and patterns
- `nuxt-best-practices/` — Nuxt 4 architecture and data fetching patterns

**Marketing:**

- `social-content/` — Social media content creation and viral strategies
- `launch-strategy/` — Product launch planning (ORB framework, Product Hunt)
- `copywriting/` — Marketing copy, headlines, CTAs
- `marketing-psychology/` — Mental models, persuasion, behavioral science
- `marketing-ideas/` — 140+ SaaS marketing tactics
- `content-strategy/` — Content planning and pillar frameworks

**CLAUDE.md ALWAYS takes precedence over skills.**

### Known Conflicts (CLAUDE.md Wins)

| Skill Says                             | CLAUDE.md Says (Use This)                          |
| -------------------------------------- | -------------------------------------------------- |
| Use `useFetch`/`useAsyncData` for data | Static docs site — no dynamic data fetching needed |
| Use Pinia for state management         | No Pinia — use `ref`/`reactive` + composables      |
| Use `#shared` imports                  | No `shared/` directory — use `~/types/`            |
| Create barrel exports                  | Only if truly needed for auto-import               |

### What Skills Add (Not Covered Here)

- Reactivity: `ref` vs `reactive`, `toRefs`, `shallowRef`, `toRaw`
- Performance: `v-once`, `v-memo`, `defineAsyncComponent`, `KeepAlive`
- Templates: `v-show` vs `v-if`, proper `:key` usage, avoid `v-if` + `v-for`
- Composition API: Single-responsibility composables, return refs not reactive objects

---

## Tailwind CSS v4 Migration Rules

### Rule 16: Tailwind v4 Canonical Classes

Always use Tailwind v4 canonical class names. The Tailwind CSS IntelliSense VS Code extension reports `suggestCanonicalClasses` warnings for legacy syntax.

```
# Gradient direction
bg-gradient-to-{dir}  →  bg-linear-to-{dir}

# Important modifier (prefix → suffix)
!m-0  →  m-0!

# Arbitrary px → spacing scale (divide px by 4)
h-[400px]  →  h-100
w-[300px]  →  w-75
size-[200px]  →  size-50
gap-[20px]  →  gap-5

# Opacity fractions → integers
bg-white/[0.06]  →  bg-white/6
bg-black/[0.12]  →  bg-black/12

# Z-index and rotate
z-[100]  →  z-100
rotate-[15deg]  →  rotate-15

# Child variant
[&>*]:class  →  *:class

# Theme-dependent renames (v3 → v4)
shadow  →  shadow-sm
rounded  →  rounded-sm
blur  →  blur-sm
ring  →  ring-3
ring-[3px]  →  ring-3
```

**Note**: `[&>svg]:` is NOT the same as `*:` — it targets specific child elements, not all children. Leave specific selectors as-is.

### Rule 17: TypeScript Non-Null Assertions for Controlled Indexes

When array indexing is controlled (initialized to 0, only set via `v-for` index), use `!` non-null assertion:

```typescript
// ❌ TS error: possibly undefined
const currentTab = computed(() => tabs[activeTab.value]);

// ✅ Safe — index always valid
const currentTab = computed(() => tabs[activeTab.value]!);
```

Same applies to `useMagicKeys()` destructuring — keys are always defined at runtime but typed as `T | undefined` due to `Record` index signature:

```typescript
const { escape } = useMagicKeys();
// ❌ TS error: ComputedRef<boolean> | undefined
watch(escape, ...);
// ✅ Safe
watch(escape!, ...);
```

### Rule 18: Batch Replacement Completeness

When doing codebase-wide class replacements (sed, ast-grep, etc.), cover ALL utility prefixes and value types:

**Spacing utilities**: `h-`, `w-`, `size-`, `min-h-`, `max-h-`, `min-w-`, `max-w-`, `p-`, `pt-`, `pb-`, `pl-`, `pr-`, `px-`, `py-`, `m-`, `mt-`, `mb-`, `ml-`, `mr-`, `mx-`, `my-`, `gap-`, `top-`, `left-`, `right-`, `bottom-`, `inset-`

**Value types**: `[Npx]`, `/[0.N]` (opacity fractions), `[Ndeg]` (rotation), `[N]` (z-index)

**Verification**: After batch replacements, always grep for remaining patterns to catch misses:

```bash
# Check for remaining arbitrary px values
grep -r '\-\[.*px\]' --include='*.vue' app/ registry/
# Check for remaining opacity fractions
grep -r '/\[0\.' --include='*.vue' app/ registry/
```
