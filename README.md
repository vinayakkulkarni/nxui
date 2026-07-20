<div align="center">

<h1>nxui</h1>

<p>
  <strong>Beautiful, interactive UI components you can copy and paste into your Vue apps.</strong>
</p>

<p>
  Crafted with Vue 3, Tailwind CSS, and motion-v. Includes the only Vue port of <a href="https://shaders.paper.design">Paper Shaders</a>. Open source. Free forever.
</p>

<p>
  <a href="https://nxui.geoql.in">Documentation</a> ·
  <a href="https://nxui.geoql.in/docs/components">Components</a> ·
  <a href="https://github.com/vinayakkulkarni/nxui/issues">Report Bug</a> ·
  <a href="https://github.com/vinayakkulkarni/nxui/issues">Request Feature</a>
</p>

<p>
  <a href="https://github.com/vinayakkulkarni/nxui/actions/workflows/deploy-app.yml">
    <img src="https://github.com/vinayakkulkarni/nxui/actions/workflows/deploy-app.yml/badge.svg" alt="Deploy" />
  </a>
  <a href="https://nuxt.com">
    <img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white" alt="Nuxt" />
  </a>
  <a href="https://vuejs.org">
    <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white" alt="Vue" />
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  </a>
</p>

</div>

---

<div align="center">
  <a href="https://nxui.geoql.in">
    <img src="https://nxui.geoql.in/nxui-demo.gif?v=2" alt="nxui — animated, copy-paste UI components for Vue" width="800" />
  </a>
  <br />
  <sub>231 animated components — including all 29 Paper Shaders as Vue components. Dark mode. Copy, paste, ship.</sub>
</div>

## Introduction

nxui is a collection of beautifully designed, interactive UI components built with Vue 3 and Tailwind CSS. Just run the CLI command, add the component to your project, and start building.

It also ships the only Vue port of [Paper Shaders](https://shaders.paper.design) — all 29 WebGL shaders from paper.design wrapped as Vue components with typed props (`@paper-design/shaders` does 1.7M+ npm downloads/month; the Vue wrappers live here).

### Why nxui?

- **Copy & Paste** — Not a dependency. You own the code.
- **Interactive** — Cursor-following effects, 3D transforms, and smooth animations.
- **Customizable** — Built with Tailwind CSS. Easy to modify.
- **Dark Mode** — All components support light and dark modes.
- **TypeScript** — Fully typed for the best developer experience.

## Quick Start

The fastest way to add components is using the shadcn-vue CLI:

```bash
npx shadcn-vue@latest add https://nxui.geoql.in/r/spotlight-card.json
```

## Components (231)

> The registry also ships one internal helper, `paper-shader-mount`, that the
> Paper Shaders depend on — so `npx shadcn-vue add` resolves 232 items total,
> of which these 231 are user-facing components.

### Text Animations (33)

| Component                                                                                                         | Description                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ASCII Text](https://nxui.geoql.in/docs/text-animations/ascii-text)                                               | Three.js rendered text converted to ASCII art with animated wave distortion.                                                                                                         |
| [Blur Text](https://nxui.geoql.in/docs/text-animations/blur-text)                                                 | Words or letters animate from blurred to clear with a staggered entrance, triggered on scroll into view.                                                                             |
| [Circular Text](https://nxui.geoql.in/docs/text-animations/circular-text)                                         | Layouts characters around a circle with optional rotation animation.                                                                                                                 |
| [Count Up](https://nxui.geoql.in/docs/text-animations/count-up)                                                   | Animated number counter with easeOutExpo easing, triggered on scroll into view.                                                                                                      |
| [Cursor Driven Particle Typography](https://nxui.geoql.in/docs/text-animations/cursor-driven-particle-typography) | Canvas-based text rendered as particles that disperse on cursor hover with spring physics.                                                                                           |
| [Curved Loop](https://nxui.geoql.in/docs/text-animations/curved-loop)                                             | Text scrolling along a curved SVG path with drag interaction.                                                                                                                        |
| [Decrypted Text](https://nxui.geoql.in/docs/text-animations/decrypted-text)                                       | Hacker-style text decryption effect that scrambles characters before revealing the original text.                                                                                    |
| [Editorial Orbs](https://nxui.geoql.in/docs/text-animations/editorial-orbs)                                       | Bouncing glowing orbs with text that dynamically flows around them in multi-column layout with drop caps and pull quotes.                                                            |
| [Falling Text](https://nxui.geoql.in/docs/text-animations/falling-text)                                           | Matter.js physics-based falling text where words collapse and tumble with realistic gravity.                                                                                         |
| [Fuzzy Text](https://nxui.geoql.in/docs/text-animations/fuzzy-text)                                               | Canvas-based fuzzy blur text with hover intensity, directional displacement, glitch mode, gradient fill, and click effects.                                                          |
| [Glitch Text](https://nxui.geoql.in/docs/text-animations/glitch-text)                                             | RGB split and distortion glitch effect with jitter animations and optional hover trigger.                                                                                            |
| [Gradient Text](https://nxui.geoql.in/docs/text-animations/gradient-text)                                         | Animated flowing gradient across text with customizable colors and speed.                                                                                                            |
| [Hyper Text](https://nxui.geoql.in/docs/text-animations/hyper-text)                                               | A text component that scrambles letters before revealing the final text on hover or load.                                                                                            |
| [Kinetic Text Reveal](https://nxui.geoql.in/docs/text-animations/kinetic-text-reveal)                             | A kinetic text reveal that segments text into words, characters, or lines and animates each into place with configurable direction, stagger, and blur.                               |
| [Letter Cascade](https://nxui.geoql.in/docs/text-animations/letter-cascade)                                       | A 3D split-flap letter animation with spring physics that cascades on hover or click.                                                                                                |
| [Logo Loop](https://nxui.geoql.in/docs/text-animations/logo-loop)                                                 | Infinite scrolling logo marquee with smooth animation and fade edges.                                                                                                                |
| [Rotating Text](https://nxui.geoql.in/docs/text-animations/rotating-text)                                         | Cycle through an array of text phrases with staggered character enter and exit transitions.                                                                                          |
| [Scrambled Text](https://nxui.geoql.in/docs/text-animations/scrambled-text)                                       | Text that scrambles characters near the cursor with a proximity-based scramble effect.                                                                                               |
| [Scroll Based Velocity](https://nxui.geoql.in/docs/text-animations/scroll-based-velocity)                         | Text that scrolls horizontally with velocity based on scroll speed and direction.                                                                                                    |
| [Scroll Float](https://nxui.geoql.in/docs/text-animations/scroll-float)                                           | Characters float up from below with scale distortion as you scroll, creating a bouncy entrance effect.                                                                               |
| [Scroll Reveal](https://nxui.geoql.in/docs/text-animations/scroll-reveal)                                         | Text that reveals word by word as you scroll, with optional blur and rotation effects.                                                                                               |
| [Shiny Text](https://nxui.geoql.in/docs/text-animations/shiny-text)                                               | A configurable shimmering text highlight with animation speed, direction, yoyo, and pause-on-hover controls.                                                                         |
| [Shuffle](https://nxui.geoql.in/docs/text-animations/shuffle)                                                     | Animated text reveal where characters shuffle through random glyphs before settling into place.                                                                                      |
| [Split Text](https://nxui.geoql.in/docs/text-animations/split-text)                                               | Staggered character or word entrance animation triggered on scroll into view.                                                                                                        |
| [Text Animate](https://nxui.geoql.in/docs/text-animations/text-animate)                                           | A premium text animation component with multiple presets including blur, fade, slide, and scale effects.                                                                             |
| [Text Cursor](https://nxui.geoql.in/docs/text-animations/text-cursor)                                             | A cursor trail effect that drops text or emoji characters along the mouse path, with configurable spacing and fade.                                                                  |
| [Text Pressure](https://nxui.geoql.in/docs/text-animations/text-pressure)                                         | Variable font text that responds to cursor proximity with weight, width, and italic axis changes.                                                                                    |
| [Text Repel](https://nxui.geoql.in/docs/text-animations/text-repel)                                               | Physics-based text where letters are repelled or attracted by the cursor with spring dynamics.                                                                                       |
| [Text String](https://nxui.geoql.in/docs/text-animations/text-string)                                             | A Verlet physics rope text animation where each character acts as a connected particle. Drag letters to unravel the string, toggle gravity, and watch characters collide and bounce. |
| [Text Type](https://nxui.geoql.in/docs/text-animations/text-type)                                                 | Typewriter effect with character-by-character typing, optional delete-and-retype loop, and blinking cursor.                                                                          |
| [True Focus](https://nxui.geoql.in/docs/text-animations/true-focus)                                               | A temporal illusion that directs attention by blurring everything except the current focal point.                                                                                    |
| [Typer Text](https://nxui.geoql.in/docs/text-animations/typer-text)                                               | Typing transition where words get staggered outline boxes while a solid accent cursor block sweeps across, scrambling characters before they settle.                                 |
| [Variable Proximity](https://nxui.geoql.in/docs/text-animations/variable-proximity)                               | Text that changes font variation settings based on cursor proximity, creating a magnetic weight/width effect.                                                                        |

### Animations (23)

| Component                                                                  | Description                                                                                                                        |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [Animated Content](https://nxui.geoql.in/docs/animations/animated-content) | Scroll-triggered entrance animation with configurable direction, distance, and easing.                                             |
| [Blob Cursor](https://nxui.geoql.in/docs/animations/blob-cursor)           | Gooey blob cursor trail with SVG filter and configurable appearance.                                                               |
| [Click Spark](https://nxui.geoql.in/docs/animations/click-spark)           | Click-triggered spark burst animation rendered on canvas.                                                                          |
| [Crosshair](https://nxui.geoql.in/docs/animations/crosshair)               | Smooth crosshair cursor replacement with horizontal and vertical lines.                                                            |
| [Cubes](https://nxui.geoql.in/docs/animations/cubes)                       | Interactive 3D CSS cube grid that tilts toward cursor with auto-animation.                                                         |
| [Electric Border](https://nxui.geoql.in/docs/animations/electric-border)   | Animated electric border with noise-driven distortion and glow effects.                                                            |
| [Fade Content](https://nxui.geoql.in/docs/animations/fade-content)         | Scroll-triggered fade-in with optional blur effect.                                                                                |
| [Ghost Cursor](https://nxui.geoql.in/docs/animations/ghost-cursor)         | Three.js-powered ghostly cursor trail with bloom, grain, and FBM noise effects.                                                    |
| [Glare Hover](https://nxui.geoql.in/docs/animations/glare-hover)           | A glare sweep animation on hover with configurable angle, size, and color.                                                         |
| [Gradual Blur](https://nxui.geoql.in/docs/animations/gradual-blur)         | Layered backdrop-filter blur gradient overlay for smooth edge fading.                                                              |
| [Image Trail](https://nxui.geoql.in/docs/animations/image-trail)           | Mouse-following image trail that spawns images at cursor position with fade and scale animations.                                  |
| [Magic Rings](https://nxui.geoql.in/docs/animations/magic-rings)           | Concentric animated rings with glow, parallax, and click burst effects.                                                            |
| [Magnet](https://nxui.geoql.in/docs/animations/magnet)                     | Element that magnetically pulls toward the cursor when nearby.                                                                     |
| [Meta Balls](https://nxui.geoql.in/docs/animations/meta-balls)             | WebGL 2 metaball shader with cursor-reactive ball and configurable colors.                                                         |
| [Noise](https://nxui.geoql.in/docs/animations/noise)                       | An animated canvas noise grain overlay for adding texture to backgrounds and sections.                                             |
| [Pixel Trail](https://nxui.geoql.in/docs/animations/pixel-trail)           | Mouse-following pixel trail with SVG gooey filter for a blobby, organic cursor effect.                                             |
| [Pixel Transition](https://nxui.geoql.in/docs/animations/pixel-transition) | Pixelated grid transition that reveals a second content layer on hover.                                                            |
| [Ribbons](https://nxui.geoql.in/docs/animations/ribbons)                   | Interactive OGL ribbon lines that follow mouse movement with spring physics.                                                       |
| [Shape Blur](https://nxui.geoql.in/docs/animations/shape-blur)             | SDF shape with cursor-reactive blur distortion rendered via Three.js shaders.                                                      |
| [Splash Cursor](https://nxui.geoql.in/docs/animations/splash-cursor)       | Full WebGL fluid simulation cursor effect with realistic ink-in-water dynamics.                                                    |
| [Star Border](https://nxui.geoql.in/docs/animations/star-border)           | Animated glowing border effect with dual radial gradient beams.                                                                    |
| [Strands](https://nxui.geoql.in/docs/animations/strands)                   | Animated flowing light strands rendered with OGL shaders, with configurable colors, waviness, glow, and optional glass refraction. |
| [Target Cursor](https://nxui.geoql.in/docs/animations/target-cursor)       | Animated crosshair cursor that snaps to target elements with corner brackets and smooth lerp tracking.                             |

### Components (76)

| Component                                                                            | Description                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Animated List](https://nxui.geoql.in/docs/components/animated-list)                 | Scroll-triggered list with scale entrance, keyboard navigation, and gradient edges.                                                                                    |
| [Animated TOC](https://nxui.geoql.in/docs/components/animated-toc)                   | Table of contents with an SVG rail that snakes through nesting levels and a dot that glides along the curve to the active entry.                                       |
| [Auth Modal](https://nxui.geoql.in/docs/components/auth-modal)                       | An authentication modal with social login buttons and email form.                                                                                                      |
| [Aurora Accordion](https://nxui.geoql.in/docs/components/aurora-accordion)           | Accordion whose opened row detaches into its own card while an aurora gradient blooms behind the answer, then settles into a calm glow.                                |
| [Banknote Bento](https://nxui.geoql.in/docs/components/banknote-bento)               | Vintage engravings as ink-on-paper banknote duotones with serif captions, plus a thermal-camera card whose heat boundary rises over the artwork and types its caption. |
| [Border Glow](https://nxui.geoql.in/docs/components/border-glow)                     | A CSS-driven directional glow card that tracks cursor position and proximity to edges with configurable colors and gradients.                                          |
| [Bounce Cards](https://nxui.geoql.in/docs/components/bounce-cards)                   | Fan of image cards with staggered entrance and hover push animation.                                                                                                   |
| [Bouncy Accordion](https://nxui.geoql.in/docs/components/bouncy-accordion)           | Accordion with a playful spring bounce — the open row detaches from its neighbors with animated corner radii and a gap that springs apart.                             |
| [Bubble Menu](https://nxui.geoql.in/docs/components/bubble-menu)                     | Animated full-screen pill navigation with staggered scale-in and rotation.                                                                                             |
| [Card Nav](https://nxui.geoql.in/docs/components/card-nav)                           | Expandable navbar with staggered card reveal, hamburger toggle, and color-coded category panels.                                                                       |
| [Card Swap](https://nxui.geoql.in/docs/components/card-swap)                         | Stacked card carousel that cycles the front card to the back with 3D transforms.                                                                                       |
| [Carousel](https://nxui.geoql.in/docs/components/carousel)                           | Draggable card carousel with 3D perspective rotation and dot indicators.                                                                                               |
| [Chroma Grid](https://nxui.geoql.in/docs/components/chroma-grid)                     | Profile card grid with mouse-tracking spotlight reveal and per-card hover glow.                                                                                        |
| [Circular Gallery](https://nxui.geoql.in/docs/components/circular-gallery)           | OGL-powered curved image gallery with drag/scroll navigation and wave deformation.                                                                                     |
| [Collection Surfer](https://nxui.geoql.in/docs/components/collection-surfer)         | A 3D scroll-driven collection viewer where items surf along a perspective track. Perfect for immersive showcases.                                                      |
| [Command Menu](https://nxui.geoql.in/docs/components/command-menu)                   | A spotlight-style command palette with keyboard navigation and fuzzy search.                                                                                           |
| [Counter](https://nxui.geoql.in/docs/components/counter)                             | Animated number counter with spring-physics digit rolling and gradient fade overlays.                                                                                  |
| [Curved Drawer](https://nxui.geoql.in/docs/components/curved-drawer)                 | Slide-in drawer whose inner edge bulges with velocity via SVG path morphing, settling straight at rest.                                                                |
| [Curved Input](https://nxui.geoql.in/docs/components/curved-input)                   | A real text input bent along a circular arc — SVG textPath rendering with a caret that rides the curve and arc-length scrolling.                                       |
| [Decay Card](https://nxui.geoql.in/docs/components/decay-card)                       | SVG displacement map card that warps on cursor movement with lerp physics.                                                                                             |
| [Dithered Logo](https://nxui.geoql.in/docs/components/dithered-logo)                 | Renders any logo as a Floyd-Steinberg dithered particle field with cursor repulsion and click ripples.                                                                 |
| [Dock](https://nxui.geoql.in/docs/components/dock)                                   | A macOS-style dock with cursor-proximity magnification driven by configurable spring physics.                                                                          |
| [Dome Gallery](https://nxui.geoql.in/docs/components/dome-gallery)                   | 3D dome-shaped image gallery with CSS transforms, drag interaction, and click-to-enlarge.                                                                              |
| [Drag Reorder List](https://nxui.geoql.in/docs/components/drag-reorder-list)         | Drag-to-reorder list with lift, velocity tilt, spring-shifting siblings, and an empty-space cutout marking the drop slot.                                              |
| [Dynamic Island Header](https://nxui.geoql.in/docs/components/dynamic-island-header) | Navbar that collapses into a compact pill on scroll, morphing to show the active section and reading progress.                                                         |
| [Elastic Slider](https://nxui.geoql.in/docs/components/elastic-slider)               | Draggable slider with elastic overflow bounce and animated icons.                                                                                                      |
| [Eye Tracking](https://nxui.geoql.in/docs/components/eye-tracking)                   | Animated eyes that follow your cursor with realistic blinking, reactive pupils, and idle micro-movements. Supports realistic, cartoon, minimal, and cyber variants.    |
| [Flight Status Card](https://nxui.geoql.in/docs/components/flight-status-card)       | An animated card displaying real-time flight information with progress tracking.                                                                                       |
| [Flowing Menu](https://nxui.geoql.in/docs/components/flowing-menu)                   | Hover-activated marquee menu with edge-aware slide-in animation.                                                                                                       |
| [Fluid Glass](https://nxui.geoql.in/docs/components/fluid-glass)                     | Three.js glass refraction effect with chromatic aberration shader in lens, bar, or cube mode.                                                                          |
| [Flying Posters](https://nxui.geoql.in/docs/components/flying-posters)               | OGL-powered vertical scroll gallery with rotating poster distortion.                                                                                                   |
| [Folder](https://nxui.geoql.in/docs/components/folder)                               | Pure CSS 3D folder with open/close animation and magnetic paper hover.                                                                                                 |
| [Frosted Navigation](https://nxui.geoql.in/docs/components/frosted-navigation)       | Bottom navigation where content melts into a progressive frosted-glass gradient, with a serif search pill and spring-animated tabs.                                    |
| [Github Calendar](https://nxui.geoql.in/docs/components/github-calendar)             | A premium, customizable visualization of GitHub contribution graphs with multiple color schemes and display variants.                                                  |
| [Glass Icons](https://nxui.geoql.in/docs/components/glass-icons)                     | Glass morphism icon buttons with gradient background, 3D tilt, and label reveal on hover.                                                                              |
| [Glass Surface](https://nxui.geoql.in/docs/components/glass-surface)                 | SVG displacement-based glass distortion element with chromatic aberration and frosted backdrop filter.                                                                 |
| [Gooey Nav](https://nxui.geoql.in/docs/components/gooey-nav)                         | Particle-burst navigation with SVG gooey filter effect and spring animation.                                                                                           |
| [Infinite Menu](https://nxui.geoql.in/docs/components/infinite-menu)                 | WebGL icosahedron sphere menu with texture-mapped faces, drag rotation, and item selection.                                                                            |
| [Lanyard](https://nxui.geoql.in/docs/components/lanyard)                             | Three.js lanyard with Verlet integration rope physics, draggable badge card, and optional GLTF model.                                                                  |
| [Layered Stack](https://nxui.geoql.in/docs/components/layered-stack)                 | Stack of cards that fans out on hover, stacking back with random rotation on mouse leave.                                                                              |
| [Line Sidebar](https://nxui.geoql.in/docs/components/line-sidebar)                   | Line-and-rail sidebar navigation whose items shift, tint, and grow their markers as the cursor approaches, eased by a single rAF loop.                                 |
| [Mac Keyboard](https://nxui.geoql.in/docs/components/mac-keyboard)                   | An interactive Mac keyboard with real key tracking, sound effects, and visual feedback. Press keys on your keyboard to see them light up.                              |
| [Magic Bento](https://nxui.geoql.in/docs/components/magic-bento)                     | Interactive bento grid with spotlight tracking, particle effects, border glow, and magnetism.                                                                          |
| [Magnetic Dock](https://nxui.geoql.in/docs/components/magnetic-dock)                 | A macOS-style dock with magnetic hover magnification and genie effect.                                                                                                 |
| [Masonry](https://nxui.geoql.in/docs/components/masonry)                             | Responsive masonry image grid with blur-to-focus entrance animation and hover scaling.                                                                                 |
| [Model Viewer](https://nxui.geoql.in/docs/components/model-viewer)                   | Three.js 3D model viewer with OrbitControls, GLTF/FBX/OBJ support, auto-framing, and screenshot.                                                                       |
| [Music Player](https://nxui.geoql.in/docs/components/music-player)                   | An interactive vinyl-record music player with swinging tonearm and animated rotation.                                                                                  |
| [Node Diagram](https://nxui.geoql.in/docs/components/node-diagram)                   | An animated node diagram with glowing data pulses flowing through connections.                                                                                         |
| [Nostalgia](https://nxui.geoql.in/docs/components/nostalgia)                         | Vintage slide-viewer that cycles through memories while a fan of polaroid thumbnails arcs around it and a year + serif title crossfade underneath.                     |
| [Notification Center](https://nxui.geoql.in/docs/components/notification-center)     | Frosted notification panel with badged bell trigger, spring-animated rows that expand in place, and live relative timestamps.                                          |
| [Orbit Card Stack](https://nxui.geoql.in/docs/components/orbit-card-stack)           | A stacked deck of profile cards that fans out into an orbital arc on hover, lifting the active card with spring physics.                                               |
| [Orbit Images](https://nxui.geoql.in/docs/components/orbit-images)                   | Images orbiting along customizable path shapes including ellipse, circle, star, heart, infinity, and more.                                                             |
| [Pill Nav](https://nxui.geoql.in/docs/components/pill-nav)                           | Responsive pill-shaped navigation with smooth sliding indicator and mobile hamburger menu.                                                                             |
| [Pixel Card](https://nxui.geoql.in/docs/components/pixel-card)                       | Canvas pixel shimmer card with hover-activated sparkle effect and preset variants.                                                                                     |
| [PlayStation Navbar](https://nxui.geoql.in/docs/components/playstation-navbar)       | XMB-style cross-media navigation with a sliding category rail, glowing pill cursor, and full arrow-key control.                                                        |
| [Podcast Player](https://nxui.geoql.in/docs/components/podcast-player)               | Expandable podcast episode card driving a real audio element — waveform seek with hover scrubber, chapters, speed cycling, volume, and a compact pill mode.            |
| [Profile Card](https://nxui.geoql.in/docs/components/profile-card)                   | Holographic tilt card with pointer-tracking 3D transforms, rainbow shine effects, and avatar parallax.                                                                 |
| [Reflective Card](https://nxui.geoql.in/docs/components/reflective-card)             | Metallic ID card with SVG displacement filters, live webcam background, and chromatic aberration.                                                                      |
| [Ripple Transition](https://nxui.geoql.in/docs/components/ripple-transition)         | WebGL image transitions with noisy refractive waves, chromatic edges, glow, and click-triggered ripple origins.                                                        |
| [Scroll Choreography](https://nxui.geoql.in/docs/components/scroll-choreography)     | Scroll-driven image choreography with diagonal movement, stacking, and hero expansion phases.                                                                          |
| [Scroll Split Card](https://nxui.geoql.in/docs/components/scroll-split-card)         | Scroll-driven card that splits into 3 panels and flips to reveal content.                                                                                              |
| [Scroll Stack](https://nxui.geoql.in/docs/components/scroll-stack)                   | Scroll-driven stacked card animation with scale and sticky positioning effects.                                                                                        |
| [Scrub Input](https://nxui.geoql.in/docs/components/scrub-input)                     | An inline slider input styled as a pill, perfect for adjusting variables smoothly.                                                                                     |
| [Showcase Card](https://nxui.geoql.in/docs/components/showcase-card)                 | A card with 3D tilt effect that responds to mouse movement for showcasing content.                                                                                     |
| [Signature](https://nxui.geoql.in/docs/components/signature)                         | Animated handwriting effect that converts text to font glyph paths and reveals them with staggered SVG stroke animations.                                              |
| [Signature Eraser](https://nxui.geoql.in/docs/components/signature-eraser)           | A signing canvas whose ink disintegrates into five physics-based particle effects.                                                                                     |
| [Split Flap Display](https://nxui.geoql.in/docs/components/split-flap-display)       | An airport-style split flap display with staggered character flip animations and configurable rows.                                                                    |
| [Spotlight Card](https://nxui.geoql.in/docs/components/spotlight-card)               | A card that follows the cursor with a spotlight glow effect on hover.                                                                                                  |
| [Stack](https://nxui.geoql.in/docs/components/stack)                                 | Draggable card stack with spring animations and send-to-back gesture.                                                                                                  |
| [Staggered Menu](https://nxui.geoql.in/docs/components/staggered-menu)               | Full-screen staggered menu with animated text cycling, gradient backgrounds, and social links.                                                                         |
| [Stepper](https://nxui.geoql.in/docs/components/stepper)                             | Multi-step wizard with animated step indicators and slide transitions.                                                                                                 |
| [Sticker Peel](https://nxui.geoql.in/docs/components/sticker-peel)                   | Interactive sticker peel effect with CSS clip-path, SVG lighting filters, and drag interaction.                                                                        |
| [Sticky Scroll Cards](https://nxui.geoql.in/docs/components/sticky-scroll-cards)     | Scroll-driven card stack where images pin and scale as you scroll.                                                                                                     |
| [Testimonial Marquee](https://nxui.geoql.in/docs/components/testimonial-marquee)     | An infinite scrolling marquee of testimonial cards with smooth animation.                                                                                              |
| [Tilted Card](https://nxui.geoql.in/docs/components/tilted-card)                     | 3D tilting card that follows cursor with spring damping and tooltip caption.                                                                                           |
| [Visual Stepper](https://nxui.geoql.in/docs/components/visual-stepper)               | Auto-playing vertical stepper with growing connector bars and a crossfading preview card.                                                                              |

### Backgrounds (49)

| Component                                                                 | Description                                                                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [Antigravity](https://nxui.geoql.in/docs/backgrounds/antigravity)         | Three.js InstancedMesh particle field with mouse-driven magnetic attraction, wave animation, and configurable shapes.         |
| [Aurora](https://nxui.geoql.in/docs/backgrounds/aurora)                   | WebGL aurora borealis effect with simplex noise and configurable color stops.                                                 |
| [Balatro](https://nxui.geoql.in/docs/backgrounds/balatro)                 | Psychedelic spinning paint effect with configurable colors and pixel filtering.                                               |
| [Ballpit](https://nxui.geoql.in/docs/backgrounds/ballpit)                 | 3D physics-based ball pit with instanced meshes, subsurface scattering, and cursor interaction.                               |
| [Beams](https://nxui.geoql.in/docs/backgrounds/beams)                     | 3D light beam planes with Perlin noise deformation and directional lighting.                                                  |
| [Color Bends](https://nxui.geoql.in/docs/backgrounds/color-bends)         | Complex warp shader with mouse parallax, auto-rotation, and up to 8 custom colors.                                            |
| [Dark Veil](https://nxui.geoql.in/docs/backgrounds/dark-veil)             | CPPN neural network shader background with hue shift, scanlines, and warp distortion.                                         |
| [Dither](https://nxui.geoql.in/docs/backgrounds/dither)                   | Retro Bayer-matrix dithered noise shader background.                                                                          |
| [Dot Field](https://nxui.geoql.in/docs/backgrounds/dot-field)             | Interactive canvas dot grid with cursor bulge, glow, sparkle, and wave effects.                                               |
| [Dot Grid](https://nxui.geoql.in/docs/backgrounds/dot-grid)               | Interactive canvas dot grid with velocity-based impulse, click shockwaves, and elastic return.                                |
| [Evil Eye](https://nxui.geoql.in/docs/backgrounds/evil-eye)               | An animated evil eye background with flame effects and cursor-tracking pupil.                                                 |
| [Faulty Terminal](https://nxui.geoql.in/docs/backgrounds/faulty-terminal) | Matrix-style hacker terminal with digit patterns, scanlines, and chromatic aberration.                                        |
| [Ferrofluid](https://nxui.geoql.in/docs/backgrounds/ferrofluid)           | A WebGL ferrofluid metaball background with flowing turbulence, configurable colors, rim glow, and mouse interaction.         |
| [Floating Lines](https://nxui.geoql.in/docs/backgrounds/floating-lines)   | Multi-layered glowing wave lines with cursor-reactive bending and gradient coloring.                                          |
| [Galaxy](https://nxui.geoql.in/docs/backgrounds/galaxy)                   | OGL-powered starfield galaxy with thousands of animated points and parallax depth.                                            |
| [Gradient Blinds](https://nxui.geoql.in/docs/backgrounds/gradient-blinds) | Animated gradient blinds with spotlight, mouse tracking, and up to 8 color stops.                                             |
| [Grainient](https://nxui.geoql.in/docs/backgrounds/grainient)             | Animated gradient background with noise grain and smooth color blending.                                                      |
| [Grid Distortion](https://nxui.geoql.in/docs/backgrounds/grid-distortion) | Three.js shader-based image distortion that warps a texture in response to mouse movement.                                    |
| [Grid Motion](https://nxui.geoql.in/docs/backgrounds/grid-motion)         | A rotated grid of items that shifts horizontally based on cursor position with smooth easing.                                 |
| [Grid Scan](https://nxui.geoql.in/docs/backgrounds/grid-scan)             | Three.js animated grid with scanning line effect, bloom, chromatic aberration, and mouse-reactive distortion.                 |
| [Hyperspeed](https://nxui.geoql.in/docs/backgrounds/hyperspeed)           | Three.js highway light simulation with bloom, SMAA, distortion presets, and configurable car lights.                          |
| [Iridescence](https://nxui.geoql.in/docs/backgrounds/iridescence)         | Mesmerizing iridescent color waves with mouse-reactive distortion.                                                            |
| [Laser Flow](https://nxui.geoql.in/docs/backgrounds/laser-flow)           | Three.js volumetric laser beams with fog, mouse tilt, and flow animation using GLSL shaders.                                  |
| [Letter Glitch](https://nxui.geoql.in/docs/backgrounds/letter-glitch)     | A grid of random characters with color glitching and vignette overlays.                                                       |
| [Light Pillar](https://nxui.geoql.in/docs/backgrounds/light-pillar)       | 3D raymarched light pillar with configurable colors, quality settings, and optional mouse interaction.                        |
| [Light Rays](https://nxui.geoql.in/docs/backgrounds/light-rays)           | Animated light rays emanating from a configurable origin with mouse following and color controls.                             |
| [Lightfall](https://nxui.geoql.in/docs/backgrounds/lightfall)             | A WebGL raymarched light-streak background with falling luminous trails, configurable colors, density, and mouse interaction. |
| [Lightning](https://nxui.geoql.in/docs/backgrounds/lightning)             | WebGL-powered lightning bolt effect with fbm noise and customizable hue.                                                      |
| [Line Waves](https://nxui.geoql.in/docs/backgrounds/line-waves)           | A WebGL animated line wave background with warping, color cycling, and mouse interaction.                                     |
| [Liquid Chrome](https://nxui.geoql.in/docs/backgrounds/liquid-chrome)     | Interactive liquid chrome effect with ripple distortion and mouse tracking.                                                   |
| [Liquid Ether](https://nxui.geoql.in/docs/backgrounds/liquid-ether)       | Full Navier-Stokes fluid simulation with mouse interaction, auto-demo driver, and customizable color palette.                 |
| [Metallic Paint](https://nxui.geoql.in/docs/backgrounds/metallic-paint)   | Raw WebGL2 metallic paint effect with Laplacian depth solve, chromatic aberration, and mouse-driven ripples.                  |
| [Orb](https://nxui.geoql.in/docs/backgrounds/orb)                         | Glowing orb with hue-shifted noise, hover distortion, and optional rotation.                                                  |
| [Particles](https://nxui.geoql.in/docs/backgrounds/particles)             | OGL particle system with velocity simulation, mouse influence, and connection lines.                                          |
| [Pixel Blast](https://nxui.geoql.in/docs/backgrounds/pixel-blast)         | Dithered pixel pattern with Bayer matrix, FBM noise, click ripples, and configurable shapes.                                  |
| [Pixel Snow](https://nxui.geoql.in/docs/backgrounds/pixel-snow)           | 3D voxel-raymarched pixelated snowfall with configurable flake shapes and wind direction.                                     |
| [PlasmaWave](https://nxui.geoql.in/docs/backgrounds/plasma-wave)          | Raymarched plasma waves with dual-wave interference and OGL.                                                                  |
| [Plasma](https://nxui.geoql.in/docs/backgrounds/plasma)                   | WebGL2 ray-marched plasma background with mouse interaction, configurable colors, speed, and direction.                       |
| [Prism](https://nxui.geoql.in/docs/backgrounds/prism)                     | A prismatic light refraction background rendered with WebGL shaders.                                                          |
| [Prismatic Burst](https://nxui.geoql.in/docs/backgrounds/prismatic-burst) | WebGL 2 raymarched spectral burst with configurable colors, distortion, and 3D animation modes.                               |
| [Radar](https://nxui.geoql.in/docs/backgrounds/radar)                     | An animated radar sweep background with concentric rings and radial spokes.                                                   |
| [Ripple Grid](https://nxui.geoql.in/docs/backgrounds/ripple-grid)         | Animated sine-wave ripple grid with mouse interaction, rainbow mode, and vignette.                                            |
| [Shape Grid](https://nxui.geoql.in/docs/backgrounds/shape-grid)           | An animated grid of shapes with hover trail effects and directional movement.                                                 |
| [Side Rays](https://nxui.geoql.in/docs/backgrounds/side-rays)             | A WebGL light-rays background emanating from a screen corner, with configurable origin, tilt, colors, spread, and falloff.    |
| [Silk](https://nxui.geoql.in/docs/backgrounds/silk)                       | Silky fabric-like shader background with flowing noise patterns and configurable color.                                       |
| [Soft Aurora](https://nxui.geoql.in/docs/backgrounds/soft-aurora)         | A WebGL aurora borealis background effect with perlin noise, cosine gradient coloring, and mouse interaction.                 |
| [Squares](https://nxui.geoql.in/docs/backgrounds/squares)                 | Animated grid of squares with directional movement and hover interaction.                                                     |
| [Threads](https://nxui.geoql.in/docs/backgrounds/threads)                 | Animated Perlin noise thread lines with mouse-reactive distortion and configurable color.                                     |
| [Waves](https://nxui.geoql.in/docs/backgrounds/waves)                     | Perlin noise-driven wave lines with cursor-reactive distortion.                                                               |

### Hero Backgrounds (6)

| Component                                                                          | Description                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Animated Gradient](https://nxui.geoql.in/docs/hero-backgrounds/animated-gradient) | A beautiful, animated, and customizable WebGL gradient with noise capabilities. Supports built-in presets (Aurora, Oceanic, Amber, Toxic, Ghost) and fully custom configurations. |
| [Dither Prism Hero](https://nxui.geoql.in/docs/hero-backgrounds/dither-prism-hero) | A prismatic dithered hero section with advanced WebGL shaders featuring ordered dithering, holographic iridescence, and floating particles.                                       |
| [Hero Geometric](https://nxui.geoql.in/docs/hero-backgrounds/hero-geometric)       | A dithered geometric gradient hero section powered by Three.js shaders with simplex noise and Bayer dithering.                                                                    |
| [Prism Gradient](https://nxui.geoql.in/docs/hero-backgrounds/prism-gradient)       | WebGL2 hero gradient — three colors swirled through sixteen iterations of sinusoidal distortion, tracking light and dark mode automatically.                                      |
| [Silk Aurora](https://nxui.geoql.in/docs/hero-backgrounds/silk-aurora)             | Premium WebGL hero with satin-dark aurora ribbons, pearlescent highlights, fine film grain, and cursor depth that bends the light toward the pointer.                             |
| [WebGL Liquid](https://nxui.geoql.in/docs/hero-backgrounds/webgl-liquid)           | A premium liquid hero background powered by raw WebGL shaders, with configurable palette, grain, reveal timing, and flow behavior.                                                |

### Visual Effects (12)

| Component                                                                              | Description                                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Border Beam](https://nxui.geoql.in/docs/visual-effects/border-beam)                   | A moving gradient beam that travels along the border of its container. Perfect for highlighting active states.           |
| [Closing Plasma](https://nxui.geoql.in/docs/visual-effects/closing-plasma)             | A premium footer-ready plasma background with atmospheric noise and smooth pointer-driven flow.                          |
| [Dither Gradient](https://nxui.geoql.in/docs/visual-effects/dither-gradient)           | A dithered gradient effect rendered on canvas with customizable colors and animation.                                    |
| [Image Ripple Effect](https://nxui.geoql.in/docs/visual-effects/image-ripple-effect)   | A WebGL-based image distortion effect that creates ripple waves on mouse hover using FBO ping-pong displacement mapping. |
| [Infinite Image Field](https://nxui.geoql.in/docs/visual-effects/infinite-image-field) | A camera-based infinite scrolling image grid on canvas, driven by cursor position with smooth velocity interpolation.    |
| [Liquid Blob](https://nxui.geoql.in/docs/visual-effects/liquid-blob)                   | A morphing liquid blob animation that follows the cursor with spring physics.                                            |
| [Magnet Lines](https://nxui.geoql.in/docs/visual-effects/magnet-lines)                 | Lines that bend toward the cursor like a magnetic field with smooth transitions.                                         |
| [Matrix Rain](https://nxui.geoql.in/docs/visual-effects/matrix-rain)                   | The iconic Matrix digital rain effect rendered on canvas with theme-aware colors.                                        |
| [Noise Texture](https://nxui.geoql.in/docs/visual-effects/noise-texture)               | A subtle noise overlay that adds texture and depth to any container.                                                     |
| [Particle Galaxy](https://nxui.geoql.in/docs/visual-effects/particle-galaxy)           | A swirling 3D particle galaxy effect with spiral arms that responds to mouse movement.                                   |
| [Pixel Canvas](https://nxui.geoql.in/docs/visual-effects/pixel-canvas)                 | An interactive pixel grid canvas that responds to mouse movement with customizable colors.                               |
| [Pixel Wave](https://nxui.geoql.in/docs/visual-effects/pixel-wave)                     | A looping pixel-art ocean swell rendered on a dark LED grid of colored patches.                                          |

### Buttons (3)

| Component                                                                               | Description                                                                            |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Interactive Hover Button](https://nxui.geoql.in/docs/buttons/interactive-hover-button) | A button with a slide-and-reveal hover effect that transitions content and background. |
| [Pulsating Button](https://nxui.geoql.in/docs/buttons/pulsating-button)                 | Vue port of the pulsating-button component from componentry.fun.                       |
| [Shimmer Button](https://nxui.geoql.in/docs/buttons/shimmer-button)                     | A button with a rotating shimmer/glow effect.                                          |

### Paper Shaders (29)

| Component                                                                                       | Description                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Color Panels](https://nxui.geoql.in/docs/paper-shaders/paper-color-panels)                     | Pseudo-3D semi-transparent panels rotating around a central axis.                                                                                                                                             |
| [Dithering](https://nxui.geoql.in/docs/paper-shaders/paper-dithering)                           | Animated 2-color dithering over multiple pattern sources (noise, warp, dots, waves, ripple, swirl, sphere).                                                                                                   |
| [Dot Grid](https://nxui.geoql.in/docs/paper-shaders/paper-dot-grid)                             | A static grid pattern made of circles, diamonds, squares, or triangles with adjustable colors, spacing, and size.                                                                                             |
| [Dot Orbit](https://nxui.geoql.in/docs/paper-shaders/paper-dot-orbit)                           | Animated multi-color dots with each dot orbiting around its cell center. Supports up to 10 colors and a range of shape and motion controls.                                                                   |
| [Fluted Glass](https://nxui.geoql.in/docs/paper-shaders/paper-fluted-glass)                     | Fluted glass image filter that transforms an image into streaked, ribbed distortions, giving a mix of clarity and obscurity.                                                                                  |
| [Gem Smoke](https://nxui.geoql.in/docs/paper-shaders/paper-gem-smoke)                           | Animated color fields placed over an uploaded logo shape with smoky noise behind the glassy shape.                                                                                                            |
| [God Rays](https://nxui.geoql.in/docs/paper-shaders/paper-god-rays)                             | Volumetric light rays with configurable colors, density, intensity, and bloom highlight.                                                                                                                      |
| [Grain Gradient](https://nxui.geoql.in/docs/paper-shaders/paper-grain-gradient)                 | Multi-color gradients with grainy, noise-textured distortion available in 7 animated abstract forms.                                                                                                          |
| [Halftone CMYK](https://nxui.geoql.in/docs/paper-shaders/paper-halftone-cmyk)                   | A CMYK halftone printing effect applied to images with customizable dot patterns and ink colors for each channel.                                                                                             |
| [Halftone Dots](https://nxui.geoql.in/docs/paper-shaders/paper-halftone-dots)                   | A halftone-dot image filter featuring customizable grids, color palettes, and dot styles.                                                                                                                     |
| [Heatmap](https://nxui.geoql.in/docs/paper-shaders/paper-heatmap)                               | A glowing gradient of colors flowing through an input shape. The effect creates a smoothly animated wave of intensity across the image.                                                                       |
| [Image Dithering](https://nxui.geoql.in/docs/paper-shaders/paper-image-dithering)               | A dithering image filter with support for 4 dithering modes and multiple color palettes — 2-color, 3-color, and multicolor options, using either predefined colors or colors sampled from the original image. |
| [Liquid Metal](https://nxui.geoql.in/docs/paper-shaders/paper-liquid-metal)                     | A futuristic liquid metal material applied to an uploaded logo or abstract shape, with fluid motion distortion along edges.                                                                                   |
| [Mesh Gradient](https://nxui.geoql.in/docs/paper-shaders/paper-mesh-gradient)                   | A flowing composition of color spots moving along distinct trajectories with organic distortion.                                                                                                              |
| [Metaballs](https://nxui.geoql.in/docs/paper-shaders/paper-metaballs)                           | Up to 20 colored gooey balls moving around the center and merging into smooth organic shapes.                                                                                                                 |
| [Neuro Noise](https://nxui.geoql.in/docs/paper-shaders/paper-neuro-noise)                       | A glowing, web-like structure of fluid lines and soft intersections for atmospheric, organic-yet-futuristic visuals.                                                                                          |
| [Perlin Noise](https://nxui.geoql.in/docs/paper-shaders/paper-perlin-noise)                     | Classic animated 3D Perlin noise with exposed controls for octaves, persistence, and lacunarity.                                                                                                              |
| [Pulsing Border](https://nxui.geoql.in/docs/paper-shaders/paper-pulsing-border)                 | Luminous trails of color merging into a glowing gradient contour.                                                                                                                                             |
| [Simplex Noise](https://nxui.geoql.in/docs/paper-shaders/paper-simplex-noise)                   | A multi-color gradient mapped into smooth, animated curves built as a combination of two Simplex noises.                                                                                                      |
| [Smoke Ring](https://nxui.geoql.in/docs/paper-shaders/paper-smoke-ring)                         | A radial, multi-colored gradient ring shaped with layered noise for a natural, smoky aesthetic.                                                                                                               |
| [Spiral](https://nxui.geoql.in/docs/paper-shaders/paper-spiral)                                 | Configurable spiral with stroke width, taper, cap, density, and optional noise distortion.                                                                                                                    |
| [Static Mesh Gradient](https://nxui.geoql.in/docs/paper-shaders/paper-static-mesh-gradient)     | Multi-point mesh gradient with up to 10 color spots, enhanced by two-direction warping, adjustable blend sharpness, and grain controls.                                                                       |
| [Static Radial Gradient](https://nxui.geoql.in/docs/paper-shaders/paper-static-radial-gradient) | A static radial gradient with up to 10 blended colors, advanced mixing modes, focal point controls, and grain effects.                                                                                        |
| [Swirl](https://nxui.geoql.in/docs/paper-shaders/paper-swirl)                                   | Animated bands of color twisting and bending, producing spirals, arcs, and flowing circular patterns.                                                                                                         |
| [Paper Texture](https://nxui.geoql.in/docs/paper-shaders/paper-texture)                         | A static texture built from multiple noise layers, usable for realistic paper and cardboard surfaces. Can be used as an image filter or as a standalone texture.                                              |
| [Voronoi](https://nxui.geoql.in/docs/paper-shaders/paper-voronoi)                               | Voronoi cell diagram with configurable colors, glow, gap width, and organic distortion.                                                                                                                       |
| [Warp](https://nxui.geoql.in/docs/paper-shaders/paper-warp)                                     | Organic warp distortion of a multi-color field with selectable shape patterns, swirl, and noise distortion.                                                                                                   |
| [Water](https://nxui.geoql.in/docs/paper-shaders/paper-water)                                   | Water-like surface distortion with natural caustic realism. Works as an image filter or standalone animated texture.                                                                                          |
| [Waves](https://nxui.geoql.in/docs/paper-shaders/paper-waves)                                   | Morphing wave pattern with controllable shape, frequency, amplitude, and spacing.                                                                                                                             |

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Components**: [Vue 3](https://vuejs.org)
- **Animation**: [motion-v](https://github.com/motiondivision/motion-vue)
- **Package Manager**: [pnpm](https://pnpm.io)

## Development

### Prerequisites

- [Node.js 24+](https://nodejs.org)
- [pnpm 11.3+](https://pnpm.io) (recommended: install via `corepack enable`)

### Setup

```bash
# Clone the repository
git clone https://github.com/vinayakkulkarni/nxui.git
cd nxui

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Available Scripts

| Command                   | Description                          |
| ------------------------- | ------------------------------------ |
| `pnpm run dev`            | Start development server             |
| `pnpm run build`          | Build for production                 |
| `pnpm run lint`           | Run oxlint                           |
| `pnpm run lint:fix`       | Fix lint issues automatically        |
| `pnpm run format`         | Format with oxfmt                    |
| `pnpm run format:check`   | Verify formatting                    |
| `pnpm run build:registry` | Build registry JSONs → `public/r/`   |
| `pnpm run update:deps`    | Interactively update all deps (taze) |

## Contributing

We welcome contributions! Whether it's:

- Reporting a bug
- Submitting a fix
- Proposing new features
- Creating new components

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/new-component`)
3. Commit your changes (`git commit -Sam 'feat: add component'`)
4. Push to the branch (`git push origin feat/new-component`)
5. Open a [Pull Request](https://github.com/vinayakkulkarni/nxui/compare)

### Component Guidelines

When creating new components:

- Use TypeScript with proper type definitions
- Support both light and dark modes
- Include comprehensive props with sensible defaults
- Add smooth transitions and animations
- Write clear documentation with examples
- Follow existing code style and patterns

## License

MIT License — feel free to use these components in personal and commercial projects.

See [LICENSE](./LICENSE) for more information.

## Acknowledgments

nxui is a Vue port of [Componentry](https://componentry.fun) by [Harsh Jadhav](https://github.com/harshjdhv). The original component designs and interactions come from that project.

- [Componentry](https://componentry.fun) ([GitHub](https://github.com/harshjdhv/componentry)) — Original React component library that nxui ports to Vue
- [Paper Shaders](https://shaders.paper.design) ([GitHub](https://github.com/paper-design/shaders)) — Zero-dependency WebGL shader library by [paper.design](https://paper.design), Apache-2.0. nxui wraps all 29 shaders as Vue components
- [React Bits](https://reactbits.dev) ([GitHub](https://github.com/DavidHDev/react-bits)) — Animated React component collection and ecosystem inspiration
- [shadcn-vue](https://www.shadcn-vue.com/) — Vue port of shadcn/ui
- [motion-v](https://github.com/motiondivision/motion-vue) — Vue animation library
- [VueUse](https://vueuse.org/) — Collection of Vue composition utilities

---

<p align="center">
  Made with care by <a href="https://vinayakkulkarni.dev">Vinayak Kulkarni</a>
</p>
