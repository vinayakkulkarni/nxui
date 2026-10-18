---
title: nxui vs Vue Bits vs Inspira UI
description: How nxui compares with Vue Bits and Inspira UI, the other animated copy-paste component libraries for Vue 3 and Nuxt, by size, license, install method and coverage.
---

nxui, Vue Bits and Inspira UI are the three main collections of animated, copy-paste components for Vue 3. All three give you the component source instead of a package to import. They differ in size, license, how you install a component, and what kinds of components they cover. The numbers below were checked against each project's public repository on 18 October 2026.

## At a glance

|                              | nxui                                                                           | Vue Bits                          | Inspira UI                                                         |
| ---------------------------- | ------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| Components                   | 364                                                                            | about 200                         | about 155                                                          |
| License                      | MIT                                                                            | MIT + Commons Clause              | MIT                                                                |
| Install                      | `shadcn-vue` CLI, one command per component                                    | `jsrepo` CLI or a shadcn registry | `shadcn-vue` CLI, or copy the code                                 |
| Built on                     | Vue 3, Nuxt 4, Tailwind CSS v4, motion-v                                       | Vue 3, Vite, GSAP, motion-v       | Vue 3, Nuxt, Tailwind CSS v4, motion-v, GSAP                       |
| Dashboard widgets and charts | Yes: KPI cards, data tables, 8 charts                                          | No                                | Some visualization components                                      |
| Paper Shaders                | All 30, as Vue components                                                      | No                                | No                                                                 |
| MCP for AI assistants        | Its own remote MCP server                                                      | Through the shadcn MCP server     | Not documented                                                     |
| Source of most components    | Original work, plus Vue ports of React Bits, componentry.fun and Paper Shaders | Official Vue port of React Bits   | Vue ports of Aceternity UI and Magic UI, plus community components |

## When to pick nxui

- You want the largest single collection: text animations, WebGL backgrounds, hero sections, buttons, cursor effects, dashboard widgets, charts and shaders in one registry.
- You build product UI, not only landing pages. nxui is the only one of the three with KPI cards, a TanStack-based data table, status panels and a chart set whose API matches TanStack Charts, so you can swap in `@tanstack/vue-charts` by changing one import.
- You want a plain MIT license with no limits on redistribution.
- You already use `shadcn-vue`. Every nxui component installs with `npx shadcn-vue@latest add "https://nxui.geoql.in/r/<name>.json"` and lands as source you own.

## When to pick Vue Bits

- You want the official Vue port of React Bits and to stay in step with its upstream releases.
- You use `jsrepo` already.
- The Commons Clause fits your use. It allows use inside your own app or site, but not redistributing the components as a library.

## When to pick Inspira UI

- You want Vue versions of specific Aceternity UI or Magic UI components.
- You prefer a library with a larger community: it has the most GitHub stars of the three.

## Using more than one

The three libraries do not conflict. Each installs plain `.vue` files into your project, so you can take a chart from nxui, a background from Vue Bits and a card from Inspira UI in the same Nuxt app. Watch for duplicate dependencies such as two versions of `three` or `gsap`.

## How the numbers were counted

- **nxui:** documented component pages in the [nxui repository](https://github.com/vinayakkulkarni/nxui).
- **Vue Bits:** component folders under `src/content` in the [Vue Bits repository](https://github.com/DavidHDev/vue-bits). Its README says "90+ components", which predates later additions.
- **Inspira UI:** component pages under `content/en/2.components` in the [Inspira UI repository](https://github.com/unovue/inspira-ui).

If a number here is out of date, [open an issue](https://github.com/vinayakkulkarni/nxui/issues) and it will be corrected.
