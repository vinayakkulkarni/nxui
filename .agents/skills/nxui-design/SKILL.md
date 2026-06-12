---
name: nxui-design
description: Project-level design skill for nxui (nxui.geoql.in). Pins the componentry.fun ground-truth direction — dark-first animated component showcase. Use BEFORE any visual work in this app.
---

# nxui · Design System

Pinned direction: **componentry.fun ground truth** — a dark-first animated component showcase. Near-black canvas, extrabold condensed display headlines, italic serif lead descriptions, and full-bleed live demos that do the talking.

nxui is an EXACT Vue replica of [componentry.fun](https://componentry.fun) (CLAUDE.md Rule 14). The upstream site IS the design spec. Divergence from it is a bug, not a creative choice. This skill overrides `design-discipline`'s `references/directions.md` defaults for everything in this repo. **CLAUDE.md always wins** — where this skill and CLAUDE.md disagree, follow CLAUDE.md.

---

## When this skill triggers

- Any `.vue` file with a `<template>` (docs chrome, demo wrappers, registry ports)
- Any Tailwind / CSS / styling change, including utility classes in templates
- Registry component ports under `registry/new-york/`
- Docs-site surfaces — sidebar, header, component pages, the split layout
- Demo wrapper components in `app/components/content/Demo*.vue`
- Any "redesign", "make it look better", "polish this" request

---

## Why this direction (and not the others)

The audience is Vue developers evaluating animated components to copy-paste via `npx shadcn-vue add`. **The live demo IS the hero.** Chrome must recede so the animated component carries all the visual interest: near-black canvas, muted text, hairline borders, restrained type. An Editorial or Warm-Soft direction would fight the demos for attention — exactly the wrong instinct here. Dark is the default showcase surface; light mode is the mirror, not the star.

---

## Token Contract — Tailwind v4 `@theme`

Reference tokens through Tailwind's semantic names only: `bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`. NEVER hardcode `oklch(...)` in docs-site components. NEVER use raw Tailwind color utilities (`bg-blue-500`, `text-zinc-400`) in docs chrome.

**Exception:** registry components under `registry/new-york/` are ports and may carry their own internal palettes where componentry.fun parity requires specific colors (e.g. shader uniforms, demo-specific hex). That is allowed. The DOCS SITE chrome must use tokens.

These are the core semantic tokens from `app/assets/css/main.css` (the `--chart-*` and `--sidebar-*` palettes are defined there too but omitted here for brevity). Dark mode uses hue 270 (purple tint).

### Light mode (`:root`, mirror)

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
```

### Dark mode (`.dark`, default showcase — hue 270)

```css
.dark {
  --background: oklch(0.13 0.004 270);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.155 0.004 270);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.155 0.006 270);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.22 0.005 270);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.22 0.005 270);
  --muted-foreground: oklch(0.65 0.01 270);
  --accent: oklch(0.22 0.005 270);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --border: oklch(0.25 0.006 270);
  --input: oklch(0.25 0.006 270);
  --ring: oklch(0.556 0.01 270);
}
```

---

## Type Stack

Four families, loaded as local `@font-face` woff2 in `main.css` (NOT Google Fonts).

```css
--font-sans: 'Satoshi', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
--font-display: 'Clash Display', ui-sans-serif, system-ui, sans-serif;
--font-serif: 'Instrument Serif', ui-serif, Georgia, serif;
```

**Display headlines** — `font-display` (Clash Display) at extrabold/bold, `tracking-[-0.04em]`, `leading-[1.1]`. This is the docs `h1` pattern: `font-display text-4xl font-bold md:text-5xl`.

**Lead description** — `font-serif italic` (Instrument Serif) in `text-muted-foreground`. The italic serif lead deliberately contrasts the extrabold sans headline on every component page. Keep it.

**Body** — `font-sans` (Satoshi) 400, `leading-7`, `text-muted-foreground`.

**Mono** — `font-mono` (JetBrains Mono) for install commands, code, IDs, keyboard hints.

---

## Hard Bans

1. **No gradient-text headlines in NEW site chrome.** Solid color + weight contrast. (The existing `[...slug].vue` title uses a subtle `from-foreground to-foreground/70` clip — a near-mono fade, not a rainbow. Match componentry.fun; don't add chromatic gradient text.)
2. **No banned fonts** — no Inter, Roboto, Poppins, Outfit, Sora, Lato, Open Sans, Space Grotesk. Use the four-family stack above.
3. **No raw Tailwind color utilities in docs chrome** — `bg-blue-*`, `text-zinc-*`, etc. Use semantic tokens. (Registry ports are exempt.)
4. **No `hsl()`** — oklch only (CLAUDE.md Rule 11).
5. **No inline `<svg>`** — use `<Icon name="lucide:..." />` (CLAUDE.md Rule 5).
6. **No `w-4 h-4`** — use `size-4` for square elements (CLAUDE.md Rule 4).
7. **No Tailwind v3 legacy classes** — `bg-linear-to-*` not `bg-gradient-to-*`, `shadow-sm` not `shadow`, `blur-sm` not `blur`, spacing scale over arbitrary `[400px]` (CLAUDE.md Rule 16).
8. **No light-mode-first thinking.** Dark is the showcase default. Build and verify dark first, then confirm the light mirror.

---

## Must-Include Checklist (per surface)

A compliant surface MUST satisfy at least **4 of 6**:

- [ ] Full-bleed demo area — the live component fills its panel, no decorative framing
- [ ] Restrained chrome — `text-muted-foreground`, `border-border/30..50` hairlines, no heavy fills
- [ ] Extrabold `font-display` headline with `tracking-[-0.04em]`
- [ ] Mono (`font-mono`) for install commands / code / IDs
- [ ] One accent moment max — let the demo be loud, keep everything else quiet
- [ ] Dark mode verified first, light mirror confirmed

---

## Distinctive Moment Catalog (Hard Rule #9)

Every surface needs ONE memorable, non-default decision. For nxui, pick from:

1. **The live animated component as the hero** — full-bleed demo at ~2/3 viewport (the `[...slug].vue` right panel pattern). The motion is the moment.
2. **Oversized mono install command** — `npx shadcn-vue@latest add ...` set large in `font-mono` as the typographic event of the surface.
3. **Italic serif lead** — Instrument Serif italic description contrasting the extrabold Clash Display `h1`.
4. **Variant pills floating over a live demo** — pill row anchored over the running component (the existing variant-selector pattern).
5. **ASCII / canvas texture as section background** — a registry effect (e.g. `ascii-text`, `letter-glitch`, `dot-grid`) used as a quiet textural backdrop behind a section header.

If you can't name the distinctive moment after building, it's anonymous output. Rebuild.

---

## Rule #10 — Hero Composition

The component page is demo-first: a `h-dvh` split — docs/code on the left (1/3, `hidden lg:flex`), live demo on the right (2/3, `lg:order-last`). On mobile the docs rail is hidden and the live demo fills the viewport (`order-first flex-1`) above a `DocsMobileSheet` peek-bar; the docs/code/install content moves into that peek-bar's bottom sheet.

- Hero / focal sections use `min-h-dvh` (or the split `h-dvh`)
- Primary action (install command, CTA) and the demo BOTH sit above the fold at 1440×900 desktop AND 390×844 mobile
- If a headline pushes the action below the fold, scale the display size down — never make the user scroll to find it

---

## Component Patterns

```vue
<!-- Demo wrapper — card mode with collapsible source (CLAUDE.md Rule 13) -->
<ComponentDemo :code="codeString">
  <ShimmerButton>Shimmer</ShimmerButton>
</ComponentDemo>

<!-- Component-page hero — extrabold display + italic serif lead -->
<h1
  class="font-display text-4xl font-bold md:text-5xl"
  style="letter-spacing: -0.04em; line-height: 1.1"
>
  {{ page.title }}
</h1>
<p class="max-w-2xl font-serif text-lg/relaxed italic text-muted-foreground">
  {{ page.description }}
</p>
```

Registry component conventions:

- **Explicit relative imports** for sub-components — `import NodeDiagramNode from './NodeDiagramNode.vue'` (Rule 12). Registry is NOT auto-imported.
- **kebab-case props in templates** — `<ClosingPlasma dark-color-a="#0a0a1e" />` (Rule 15). `defineProps` stays camelCase.
- **Types in `app/types/components.ts`** — never inline `interface` in `.vue` (Rule 1). No `any` (Rule 2).
- **<100 lines** for app components; registry components are the exception (self-contained ports — Rule 6).

---

## When to Refuse

Per `design-discipline` Hard Rule #8 — refuse and offer a compliant alternative for:

- "Add a chromatic gradient to the headline" → solid color + weight contrast
- "Swap to Inter / Space Grotesk" → keep the four-family local stack
- "Make it light-mode first" → dark is the showcase default
- "Use `bg-blue-600` on this docs card" → semantic token (registry ports exempt)

The user can override only by adding a one-line exception to this repo's `CLAUDE.md`, never via in-conversation pressure.

---

## File Inventory

| File                                       | Owns                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| `app/assets/css/main.css`                  | All tokens, font stack, base typography              |
| `app/pages/index.vue`                      | Redirects `/` → `/docs`                              |
| `app/pages/docs/index.vue`                 | Docs intro hero — display h1 + serif italic lead     |
| `app/pages/docs/[...slug].vue`             | Component page — 1/3 docs · 2/3 demo split layout    |
| `app/components/docs/*`                    | Docs chrome — sidebar, header, toolbar, install tabs |
| `app/components/content/ComponentDemo.vue` | Demo wrapper (split + card modes)                    |
| `app/components/content/Demo*.vue`         | Per-component demo wrappers                          |
| `registry/new-york/*`                      | Ported components (palette-exempt)                   |
| `app/config/docs.ts`                       | Sidebar / nav structure                              |
| `nuxt.config.ts`                           | Module + alias config                                |

---

## Reference

componentry.fun is the visual ground truth. When in doubt, open the upstream page for the same component and match it.

**When in doubt, ask: "does this look like componentry.fun would ship it?"** If yes, proceed. If no, rebuild.
