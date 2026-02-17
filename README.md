# nxui

[![Deploy App](https://github.com/vinayakkulkarni/nxui/actions/workflows/deploy-app.yml/badge.svg)](https://github.com/vinayakkulkarni/nxui/actions/workflows/deploy-app.yml)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/github/license/vinayakkulkarni/nxui?color=blue)](./LICENSE)

Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. Copy, paste, and ship.

## Features

- **29 Animated Components** — Buttons, cards, visual effects, text animations, hero backgrounds
- **Vue 3 + Nuxt 4** — Composition API with `<script setup>`, fully typed
- **motion-v** — Production-grade animation library for smooth transitions
- **Tailwind CSS v4** — Modern oklch color system with light/dark mode
- **shadcn-vue CLI** — Copy and paste components into your project
- **Cloudflare Pages** — Edge-deployed for fast global access

## Components

### Buttons

| Component | Description |
|-----------|-------------|
| [Shimmer Button](https://nxui.geoql.in/docs/buttons/shimmer-button) | Animated shimmer effect with light/dark mode |
| [Pulsating Button](https://nxui.geoql.in/docs/buttons/pulsating-button) | Pulsing glow animation |
| [Interactive Hover Button](https://nxui.geoql.in/docs/buttons/interactive-hover-button) | Hover-reactive button |

### Components

| Component | Description |
|-----------|-------------|
| [Auth Modal](https://nxui.geoql.in/docs/components/auth-modal) | Authentication dialog |
| [Collection Surfer](https://nxui.geoql.in/docs/components/collection-surfer) | Image collection browser |
| [Command Menu](https://nxui.geoql.in/docs/components/command-menu) | Command palette (Cmd+K) |
| [Flight Status Card](https://nxui.geoql.in/docs/components/flight-status-card) | Animated flight info card |
| [GitHub Calendar](https://nxui.geoql.in/docs/components/github-calendar) | GitHub-style contribution graph |
| [Magnetic Dock](https://nxui.geoql.in/docs/components/magnetic-dock) | macOS-style magnetic dock |
| [Node Diagram](https://nxui.geoql.in/docs/components/node-diagram) | Animated node connections |
| [Showcase Card](https://nxui.geoql.in/docs/components/showcase-card) | Product showcase with gradient |
| [Spotlight Card](https://nxui.geoql.in/docs/components/spotlight-card) | Cursor-tracking spotlight |
| [Testimonial Marquee](https://nxui.geoql.in/docs/components/testimonial-marquee) | Scrolling testimonials |

### Hero Backgrounds

| Component | Description |
|-----------|-------------|
| [Dither Prism Hero](https://nxui.geoql.in/docs/hero-backgrounds/dither-prism-hero) | Dithered prism effect |
| [Hero Geometric](https://nxui.geoql.in/docs/hero-backgrounds/hero-geometric) | Geometric shapes animation |
| [WebGL Liquid](https://nxui.geoql.in/docs/hero-backgrounds/webgl-liquid) | WebGL liquid simulation |

### Text Animations

| Component | Description |
|-----------|-------------|
| [Hyper Text](https://nxui.geoql.in/docs/text-animations/hyper-text) | Scrambling text reveal |
| [Scroll Based Velocity](https://nxui.geoql.in/docs/text-animations/scroll-based-velocity) | Scroll-speed text |
| [Text Animate](https://nxui.geoql.in/docs/text-animations/text-animate) | Character-by-character animation |
| [True Focus](https://nxui.geoql.in/docs/text-animations/true-focus) | Focus highlight effect |

### Visual Effects

| Component | Description |
|-----------|-------------|
| [Border Beam](https://nxui.geoql.in/docs/visual-effects/border-beam) | Animated border light |
| [Closing Plasma](https://nxui.geoql.in/docs/visual-effects/closing-plasma) | Plasma curtain effect |
| [Dither Gradient](https://nxui.geoql.in/docs/visual-effects/dither-gradient) | Dithered gradient background |
| [Liquid Blob](https://nxui.geoql.in/docs/visual-effects/liquid-blob) | Morphing liquid blob |
| [Magnet Lines](https://nxui.geoql.in/docs/visual-effects/magnet-lines) | Cursor-reactive line field |
| [Matrix Rain](https://nxui.geoql.in/docs/visual-effects/matrix-rain) | Matrix-style code rain |
| [Noise Texture](https://nxui.geoql.in/docs/visual-effects/noise-texture) | Animated noise overlay |
| [Particle Galaxy](https://nxui.geoql.in/docs/visual-effects/particle-galaxy) | 3D particle system |
| [Pixel Canvas](https://nxui.geoql.in/docs/visual-effects/pixel-canvas) | Interactive pixel grid |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Nuxt 4](https://nuxt.com) |
| UI | [Vue 3](https://vuejs.org) Composition API |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Animation | [motion-v](https://github.com/motiondivision/motion-vue) |
| Utilities | [VueUse](https://vueuse.org) |
| Content | [@nuxt/content](https://content.nuxt.com) |
| Icons | [@nuxt/icon](https://nuxt.com/modules/icon) (Iconify) |
| Headless UI | [reka-ui](https://reka-ui.com) |
| 3D | [Three.js](https://threejs.org) |
| Deploy | [Cloudflare Pages](https://pages.cloudflare.com) |

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Lint
bun run lint

# Format
bun run format

# Build registry JSONs
bun run build:registry
```

## Contributing

1. Fork it ([https://github.com/vinayakkulkarni/nxui/fork](https://github.com/vinayakkulkarni/nxui/fork))
2. Create your feature branch (`git checkout -b feat/new-component`)
3. Commit your changes (`git commit -Sam 'feat: add component'`)
4. Push to the branch (`git push origin feat/new-component`)
5. Create a new [Pull Request](https://github.com/vinayakkulkarni/nxui/compare)

## Author

**nxui** &copy; [Vinayak](https://vinayakkulkarni.dev), Released under the [MIT](./LICENSE) License.

> [vinayakkulkarni.dev](https://vinayakkulkarni.dev) &middot; GitHub [@vinayakkulkarni](https://github.com/vinayakkulkarni) &middot; Twitter [@_vinayak_k](https://twitter.com/_vinayak_k)

## Credits

- [shadcn-vue](https://www.shadcn-vue.com) — Vue port of shadcn/ui
- [motion-v](https://github.com/motiondivision/motion-vue) — Vue animation library
