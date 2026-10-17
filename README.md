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
  <sub>363 animated components — including all 29 Paper Shaders as Vue components. Dark mode. Copy, paste, ship.</sub>
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

## Components (363)

> The registry also ships two internal helpers — `paper-shader-mount`, which
> the Paper Shaders depend on, and `chart`, the chart engine the Charts depend
> on — so `npx shadcn-vue add` resolves 365 items total, of which these 363 are
> user-facing components.

### Text Animations (47)

| Component                                                                                                         | Description                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ASCII Effect](https://nxui.geoql.in/docs/text-animations/ascii-effect)                                           | Renders an image as dithered ASCII characters on a canvas, with static, flowing pointer-ripple, and glitch-reveal variants.                                                          |
| [ASCII Text](https://nxui.geoql.in/docs/text-animations/ascii-text)                                               | Three.js rendered text converted to ASCII art with animated wave distortion.                                                                                                         |
| [Blur Text](https://nxui.geoql.in/docs/text-animations/blur-text)                                                 | Words or letters animate from blurred to clear with a staggered entrance, triggered on scroll into view.                                                                             |
| [Circular Text](https://nxui.geoql.in/docs/text-animations/circular-text)                                         | Layouts characters around a circle with optional rotation animation.                                                                                                                 |
| [Count Up](https://nxui.geoql.in/docs/text-animations/count-up)                                                   | Animated number counter with easeOutExpo easing, triggered on scroll into view.                                                                                                      |
| [Cursor Driven Particle Typography](https://nxui.geoql.in/docs/text-animations/cursor-driven-particle-typography) | Canvas-based text rendered as particles that disperse on cursor hover with spring physics.                                                                                           |
| [Curved Loop](https://nxui.geoql.in/docs/text-animations/curved-loop)                                             | Text scrolling along a curved SVG path with drag interaction.                                                                                                                        |
| [Decrypted Text](https://nxui.geoql.in/docs/text-animations/decrypted-text)                                       | Hacker-style text decryption effect that scrambles characters before revealing the original text.                                                                                    |
| [Depth Dive](https://nxui.geoql.in/docs/text-animations/depth-dive)                                               | A manifesto you scroll through: text sections float in 3D space, dissolve as you pass through them, and warp with scroll velocity.                                                   |
| [Depth Text](https://nxui.geoql.in/docs/text-animations/depth-text)                                               | Display type extruded from stacked layers in 3D that tilts toward the pointer, orbits when idle, and presses in on hover.                                                            |
| [Echo Text](https://nxui.geoql.in/docs/text-animations/echo-text)                                                 | Tinted, blurred copies trail behind the text and settle into one word, following the cursor, drifting, or scrolling, with click bursts.                                              |
| [Editorial Orbs](https://nxui.geoql.in/docs/text-animations/editorial-orbs)                                       | Bouncing glowing orbs with text that dynamically flows around them in multi-column layout with drop caps and pull quotes.                                                            |
| [Falling Text](https://nxui.geoql.in/docs/text-animations/falling-text)                                           | Matter.js physics-based falling text where words collapse and tumble with realistic gravity.                                                                                         |
| [Flipping Word Swap](https://nxui.geoql.in/docs/text-animations/flipping-word-swap)                               | A word that flips into a second word one character at a time on hover, focus or tap, and flips back when you leave.                                                                  |
| [Fold Text](https://nxui.geoql.in/docs/text-animations/fold-text)                                                 | Text that unfolds piece by piece from a hinge edge like creased paper, with blinds and flip styles and a pointer refold.                                                             |
| [Fuzzy Text](https://nxui.geoql.in/docs/text-animations/fuzzy-text)                                               | Canvas-based fuzzy blur text with hover intensity, directional displacement, glitch mode, gradient fill, and click effects.                                                          |
| [Glitch Text](https://nxui.geoql.in/docs/text-animations/glitch-text)                                             | RGB split and distortion glitch effect with jitter animations and optional hover trigger.                                                                                            |
| [Gradient Text](https://nxui.geoql.in/docs/text-animations/gradient-text)                                         | Animated flowing gradient across text with customizable colors and speed.                                                                                                            |
| [Hyper Text](https://nxui.geoql.in/docs/text-animations/hyper-text)                                               | A text component that scrambles letters before revealing the final text on hover or load.                                                                                            |
| [Kinetic Text Reveal](https://nxui.geoql.in/docs/text-animations/kinetic-text-reveal)                             | A kinetic text reveal that segments text into words, characters, or lines and animates each into place with configurable direction, stagger, and blur.                               |
| [Letter Cascade](https://nxui.geoql.in/docs/text-animations/letter-cascade)                                       | A 3D split-flap letter animation with spring physics that cascades on hover or click.                                                                                                |
| [Logo Loop](https://nxui.geoql.in/docs/text-animations/logo-loop)                                                 | Draggable looping strip of logos with a soft edge fade, intro, wave, arc and 3D orbit paths, center lens, dock magnify and labels.                                                   |
| [Masked Heading](https://nxui.geoql.in/docs/text-animations/masked-heading)                                       | A heading whose letters show an image or looping video, with rise, scale, blur, wipe or fade entrances, pointer parallax and a spotlight.                                            |
| [Particle Text](https://nxui.geoql.in/docs/text-animations/particle-text)                                         | Canvas text built from particles that gather, rain, spiral or scan into place, repel from the cursor and burst on click.                                                             |
| [Rotating Text](https://nxui.geoql.in/docs/text-animations/rotating-text)                                         | Cycle through an array of text phrases with staggered character enter and exit transitions.                                                                                          |
| [Scrambled Text](https://nxui.geoql.in/docs/text-animations/scrambled-text)                                       | Text that scrambles characters near the cursor with a proximity-based scramble effect.                                                                                               |
| [Scroll Based Velocity](https://nxui.geoql.in/docs/text-animations/scroll-based-velocity)                         | Text that scrolls horizontally with velocity based on scroll speed and direction.                                                                                                    |
| [Scroll Float](https://nxui.geoql.in/docs/text-animations/scroll-float)                                           | Characters float up from below with scale distortion as you scroll, creating a bouncy entrance effect.                                                                               |
| [Scroll Reveal](https://nxui.geoql.in/docs/text-animations/scroll-reveal)                                         | Text that reveals word by word as you scroll, with optional blur and rotation effects.                                                                                               |
| [Shiny Text](https://nxui.geoql.in/docs/text-animations/shiny-text)                                               | A configurable shimmering text highlight with animation speed, direction, yoyo, and pause-on-hover controls.                                                                         |
| [Shuffle](https://nxui.geoql.in/docs/text-animations/shuffle)                                                     | Animated text reveal where characters shuffle through random glyphs before settling into place.                                                                                      |
| [Split Flap Text](https://nxui.geoql.in/docs/text-animations/split-flap-text)                                     | A split-flap departure board whose tiles flip through random glyphs, one flap at a time, to show each new phrase.                                                                    |
| [Split Text](https://nxui.geoql.in/docs/text-animations/split-text)                                               | Staggered character or word entrance animation triggered on scroll into view.                                                                                                        |
| [Stroke Text](https://nxui.geoql.in/docs/text-animations/stroke-text)                                             | SVG letter outlines draw themselves on one by one, then fill by wipe or fade, with dashed or dotted marching outlines and a lifted shadow.                                           |
| [Tech Text](https://nxui.geoql.in/docs/text-animations/tech-text)                                                 | A canvas wordmark whose letters turn into dashed vector outlines under the cursor, with draggable spring letters and click ripples.                                                  |
| [Text Animate](https://nxui.geoql.in/docs/text-animations/text-animate)                                           | A premium text animation component with multiple presets including blur, fade, slide, and scale effects.                                                                             |
| [Text Cursor](https://nxui.geoql.in/docs/text-animations/text-cursor)                                             | A cursor trail effect that drops text or emoji characters along the mouse path, with configurable spacing and fade.                                                                  |
| [Text Loop](https://nxui.geoql.in/docs/text-animations/text-loop)                                                 | A seamless text marquee along a curved SVG path, with a crossing band, hover pause, drag-to-fling and scroll boost.                                                                  |
| [Text Morph](https://nxui.geoql.in/docs/text-animations/text-morph)                                               | Words, numbers or prices melt into each other on a timer through blur and an SVG alpha-threshold filter, inheriting parent typography.                                               |
| [Text Pressure](https://nxui.geoql.in/docs/text-animations/text-pressure)                                         | Variable font text that responds to cursor proximity with weight, width, and italic axis changes.                                                                                    |
| [Text Repel](https://nxui.geoql.in/docs/text-animations/text-repel)                                               | Physics-based text where letters are repelled or attracted by the cursor with spring dynamics.                                                                                       |
| [Text String](https://nxui.geoql.in/docs/text-animations/text-string)                                             | A Verlet physics rope text animation where each character acts as a connected particle. Drag letters to unravel the string, toggle gravity, and watch characters collide and bounce. |
| [Text Type](https://nxui.geoql.in/docs/text-animations/text-type)                                                 | Typewriter effect with character-by-character typing, optional delete-and-retype loop, and blinking cursor.                                                                          |
| [True Focus](https://nxui.geoql.in/docs/text-animations/true-focus)                                               | A temporal illusion that directs attention by blurring everything except the current focal point.                                                                                    |
| [Typer Text](https://nxui.geoql.in/docs/text-animations/typer-text)                                               | Typing transition where words get staggered outline boxes while a solid accent cursor block sweeps across, scrambling characters before they settle.                                 |
| [Variable Proximity](https://nxui.geoql.in/docs/text-animations/variable-proximity)                               | Text that changes font variation settings based on cursor proximity, creating a magnetic weight/width effect.                                                                        |
| [Warp Text](https://nxui.geoql.in/docs/text-animations/warp-text)                                                 | WebGL glass warp that bends and refracts text around the pointer, with bulge, pinch or swirl lenses and click shockwaves.                                                            |

### Animations (35)

| Component                                                                    | Description                                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Animated Content](https://nxui.geoql.in/docs/animations/animated-content)   | Reveals its content on scroll with slides, blur, rotation, 3D tilts, soft wipes, staggered children, scroll-linked progress and a mount trigger. |
| [Blob Cursor](https://nxui.geoql.in/docs/animations/blob-cursor)             | A 3D liquid blob cursor that stretches into a tail, drips and bursts into droplets on click, in chrome, jelly, pearl or ink.                     |
| [Click Spark](https://nxui.geoql.in/docs/animations/click-spark)             | Bursts of sparks on every click, as dashes, comets, dots or stars, that can spill around buttons and fire from code.                             |
| [Crosshair](https://nxui.geoql.in/docs/animations/crosshair)                 | Crosshair cursor with live coordinates that locks onto links and buttons with measuring brackets and pulses on click.                            |
| [Crystalized Ball](https://nxui.geoql.in/docs/animations/crystalized-ball)   | A WebGL glass ball with a crackling electric rim and glowing dust that swirls with the cursor.                                                   |
| [Cubes](https://nxui.geoql.in/docs/animations/cubes)                         | A grid of outlined 3D cubes that turn to face the cursor, spin when swept and ripple on click, drawn with instanced WebGL2.                      |
| [Cursor Grid](https://nxui.geoql.in/docs/animations/cursor-grid)             | A crisp grid whose cells light up and fade behind the cursor, with grid styles, tiles and click pulses.                                          |
| [Dither Veil](https://nxui.geoql.in/docs/animations/dither-veil)             | A 1-bit dithered photo the cursor burns through to full colour, knitting back cell by cell.                                                      |
| [Elastic Mesh](https://nxui.geoql.in/docs/animations/elastic-mesh)           | Turns text or a logo into a puffy inflated WebGL2 shape you can press, poke and stretch like jelly.                                              |
| [Electric Border](https://nxui.geoql.in/docs/animations/electric-border)     | Wraps any element in crackling strands of current that surge near the cursor, jolt on click and leap off in sparks.                              |
| [Electric Logo](https://nxui.geoql.in/docs/animations/electric-logo)         | Traces any logo or image into a living lightning outline with strands, arcs, hover charge and click ripples.                                     |
| [Fade Content](https://nxui.geoql.in/docs/animations/fade-content)           | Fades content in on scroll: plain, out of focus, from washed-out gray, or through grain, mist and pixel blocks, with stagger and scrub.          |
| [Ghost Cursor](https://nxui.geoql.in/docs/animations/ghost-cursor)           | A ghost of glowing smoke that follows the cursor on a spring, curls as it rises and puffs on click, on raw WebGL2.                               |
| [Glare Hover](https://nxui.geoql.in/docs/animations/glare-hover)             | A glossy light streak that sweeps across any element in the direction the cursor moves, with a glinting rim edge.                                |
| [Glow Cursor](https://nxui.geoql.in/docs/animations/glow-cursor)             | A WebGL fluid trail of light that follows the cursor, drifts and cools as it fades, with a burst on click.                                       |
| [Gradual Blur](https://nxui.geoql.in/docs/animations/gradual-blur)           | Progressive edge blur for headers, footers and carousels, with a fade to color, hover to clear, and auto-hide at the ends of a scroll.           |
| [Halftone Reveal](https://nxui.geoql.in/docs/animations/halftone-reveal)     | Prints an image as a mono, duotone or color halftone whose dots swell into the real photo under the pointer.                                     |
| [Image Trail](https://nxui.geoql.in/docs/animations/image-trail)             | A trail of photos behind the cursor with tunable size, timing, zoom, flash, drift, 3D tilt, rotation and a stacking pile.                        |
| [Magic Rings](https://nxui.geoql.in/docs/animations/magic-rings)             | Glowing rings that pulse, ripple or breathe, swell toward the cursor, flare on click, and can tilt, spin or split into prism fringes.            |
| [Magnet](https://nxui.geoql.in/docs/animations/magnet)                       | Elements lean toward the cursor on a spring, with tilt, scale, axis locking and a movement cap; only the nearest magnet reacts.                  |
| [Meta Balls](https://nxui.geoql.in/docs/animations/meta-balls)               | Liquid metaballs that merge, stretch and pinch apart, with a cursor blob that pushes through them and splashes on click.                         |
| [Noise](https://nxui.geoql.in/docs/animations/noise)                         | Film grain overlay for photos and pages, from fine 35mm grain to dust, scratches, paper and TV static.                                           |
| [Pixel Swap](https://nxui.geoql.in/docs/animations/pixel-swap)               | New content builds in pixel by pixel in a springy wave that starts wherever the cursor enters.                                                   |
| [Pixel Trail](https://nxui.geoql.in/docs/animations/pixel-trail)             | Glossy WebGL2 pixels melt into a fluid goo trail behind the cursor, with color shifts, drips, sparkle, click bursts, dither and image reveals.   |
| [Pixel Transition](https://nxui.geoql.in/docs/animations/pixel-transition)   | Retro pixel dissolve that covers a card in pixels, swaps to the second slot and clears again, with ripple, wipe and dither patterns.             |
| [Ribbons](https://nxui.geoql.in/docs/animations/ribbons)                     | Springy WebGL2 ribbons that trail the cursor in lens, comet or even shapes, with optional wave, soft edges and tail fade.                        |
| [Ripple Distortion](https://nxui.geoql.in/docs/animations/ripple-distortion) | Pointer-driven water displacement that warps an image and leaves a decaying wake.                                                                |
| [Scroll Expand](https://nxui.geoql.in/docs/animations/scroll-expand)         | A rounded media frame that grows to full bleed as it scrolls through the viewport.                                                               |
| [Shape Blur](https://nxui.geoql.in/docs/animations/shape-blur)               | A crisp logo or shape that drifts out of focus under the pointer like a camera lens.                                                             |
| [Splash Cursor](https://nxui.geoql.in/docs/animations/splash-cursor)         | A WebGL2 fluid simulation that trails the cursor in swirling ink and bursts into a splash on click.                                              |
| [Star Border](https://nxui.geoql.in/docs/animations/star-border)             | A star that glides around the outline of a button, pill or card with a fading trail, hover laps and a click pulse.                               |
| [Sticker Peel](https://nxui.geoql.in/docs/animations/sticker-peel)           | A die-cut WebGL sticker that peels at the edge nearest the cursor and can be dragged, thrown and swung, in gloss, matte or holo finishes.        |
| [Strands](https://nxui.geoql.in/docs/animations/strands)                     | Spectral strands that twist inside a frosted glass orb and swell into one bulge, reacting to voice level, the cursor and clicks.                 |
| [Swarm Cursor](https://nxui.geoql.in/docs/animations/swarm-cursor)           | A liquid swarm of particles that flows after the cursor, curls into eddies and pours around hovered buttons.                                     |
| [Target Cursor](https://nxui.geoql.in/docs/animations/target-cursor)         | A spinning reticle cursor whose corner brackets snap around targets, follow their corner radius and show a label.                                |

### Components (139)

| Component                                                                            | Description                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Accordion Gallery](https://nxui.geoql.in/docs/components/accordion-gallery)         | Image panels that expand on hover, click or focus, with 3D tilt, parallax images and a staggered caption.                                                              |
| [Animated List](https://nxui.geoql.in/docs/components/animated-list)                 | Scrolling list whose rows spring in from the edge they scroll in from, with a gliding selection ring and arrow-key navigation.                                         |
| [Animated TOC](https://nxui.geoql.in/docs/components/animated-toc)                   | Table of contents with an SVG rail that snakes through nesting levels and a dot that glides along the curve to the active entry.                                       |
| [Annotated Text](https://nxui.geoql.in/docs/components/annotated-text)               | Inline text marked with hand-drawn SVG circles, underlines, highlights, brackets and cross-outs that draw in once when they scroll into view.                          |
| [Art Gallery](https://nxui.geoql.in/docs/components/art-gallery)                     | A museum-style painting showcase with crossfading featured artwork, poetic captions, and thumbnail navigation.                                                         |
| [Aurora Accordion](https://nxui.geoql.in/docs/components/aurora-accordion)           | Accordion whose opened row detaches into its own card while an aurora gradient blooms behind the answer, then settles into a calm glow.                                |
| [Auth Modal](https://nxui.geoql.in/docs/components/auth-modal)                       | An authentication modal with social login buttons and email form.                                                                                                      |
| [Banknote Bento](https://nxui.geoql.in/docs/components/banknote-bento)               | Vintage engravings as ink-on-paper banknote duotones with serif captions, plus a thermal-camera card whose heat boundary rises over the artwork and types its caption. |
| [Bell Toggle](https://nxui.geoql.in/docs/components/bell-toggle)                     | Pill toggle where a press rings the bell, crossfades the label and unfurls the pill.                                                                                   |
| [Block Palette](https://nxui.geoql.in/docs/components/block-palette)                 | An "Add Block" palette with search, colored block types and live previews, and pointer or keyboard drag-to-reorder that lifts the row as a tilted card.                |
| [Border Glow](https://nxui.geoql.in/docs/components/border-glow)                     | Card with a mesh-gradient border and outer glow that follow the cursor direction and grow stronger near the edges.                                                     |
| [Bounce Cards](https://nxui.geoql.in/docs/components/bounce-cards)                   | A fan of photo cards that bounce in, then spread apart and straighten the one you hover.                                                                               |
| [Bouncy Accordion](https://nxui.geoql.in/docs/components/bouncy-accordion)           | Accordion with a playful spring bounce — the open row detaches from its neighbors with animated corner radii and a gap that springs apart.                             |
| [Branched Menu](https://nxui.geoql.in/docs/components/branched-menu)                 | Collapsible menu that branches each section from a trunk and traces a line to your pick.                                                                               |
| [Bubble Menu](https://nxui.geoql.in/docs/components/bubble-menu)                     | A logo bubble and round menu button that pop open large tilted pill links with a staggered scale-in.                                                                   |
| [Call Chip](https://nxui.geoql.in/docs/components/call-chip)                         | Tool-call chip whose fill wipes across as a live timer ticks, ending green or shaking red.                                                                             |
| [Canvas Toolbar](https://nxui.geoql.in/docs/components/canvas-toolbar)               | A canvas tool switcher with a sliding active pill and number-key shortcuts, plus a floating selection toolbar with view and action menus.                              |
| [Card Nav](https://nxui.geoql.in/docs/components/card-nav)                           | A navigation bar that springs open into a row of cards, each with its own links.                                                                                       |
| [Card Swap](https://nxui.geoql.in/docs/components/card-swap)                         | A 3D stack of cards that sends the front card to the back on a timer, or when you drag and fling it.                                                                   |
| [Carousel](https://nxui.geoql.in/docs/components/carousel)                           | Swipeable spring-physics cards with five transitions, dots, timer bars or a counter, autoplay, loop and photo cards.                                                   |
| [Case Study Flip Stack](https://nxui.geoql.in/docs/components/case-study-flip-stack) | Editorial case study cards that fold upward on scroll to reveal the next story beneath.                                                                                |
| [Chroma Grid](https://nxui.geoql.in/docs/components/chroma-grid)                     | A grid of grayscale photo cards where a spotlight follows the cursor and brings back color.                                                                            |
| [Circle Input](https://nxui.geoql.in/docs/components/circle-input)                   | A segmented character input rendered as a row of circular cells that auto-types words, collapses to a single circle, and spreads back out.                             |
| [Circular Carousel](https://nxui.geoql.in/docs/components/circular-carousel)         | A 3D ring of images with bendable cards, momentum drag, snapping and click to focus.                                                                                   |
| [Circular Gallery](https://nxui.geoql.in/docs/components/circular-gallery)           | A curved WebGL image gallery you can drag, scroll or tab through, with cards that open to the full image.                                                              |
| [Code Slots](https://nxui.geoql.in/docs/components/code-slots)                       | One-time code input whose digits spring into their slots, with paste and SMS autofill, error drain and success wash.                                                   |
| [Collection Surfer](https://nxui.geoql.in/docs/components/collection-surfer)         | A 3D scroll-driven collection viewer where items surf along a perspective track. Perfect for immersive showcases.                                                      |
| [Color Picker](https://nxui.geoql.in/docs/components/color-picker)                   | A color swatch that blooms into a radial rosette of hue and pastel petals with a vertical lightness arc.                                                               |
| [Comet Dial](https://nxui.geoql.in/docs/components/comet-dial)                       | Circular dial you set by angle, with a comet trail that streaks behind the head when it moves fast and flick momentum.                                                 |
| [Command Menu](https://nxui.geoql.in/docs/components/command-menu)                   | A spotlight-style command palette with keyboard navigation and fuzzy search.                                                                                           |
| [Counter](https://nxui.geoql.in/docs/components/counter)                             | An odometer-style number whose digits roll on springs to each new value, with motion blur, an intro spin and Intl formatting.                                          |
| [Curved Drawer](https://nxui.geoql.in/docs/components/curved-drawer)                 | Slide-in drawer whose inner edge bulges with velocity via SVG path morphing, settling straight at rest.                                                                |
| [Curved Input](https://nxui.geoql.in/docs/components/curved-input)                   | An input bar bent along an arc, with text, caret and submit button that all follow the curve.                                                                          |
| [Decay Card](https://nxui.geoql.in/docs/components/decay-card)                       | An image card drawn with WebGL that tears and melts as the pointer moves, then pulls itself back together.                                                             |
| [Depth Carousel](https://nxui.geoql.in/docs/components/depth-carousel)               | Image carousel whose cards recede along a tilted 3D rail, with drag, wheel, keyboard, dot and auto-advance navigation.                                                 |
| [Dithered Logo](https://nxui.geoql.in/docs/components/dithered-logo)                 | Renders any logo as a Floyd-Steinberg dithered particle field with cursor repulsion and click ripples.                                                                 |
| [Dock](https://nxui.geoql.in/docs/components/dock)                                   | macOS style dock with spring magnification, launch hop, badges, auto hide, right-click menus with submenus, on any edge.                                               |
| [Dodge Field](https://nxui.geoql.in/docs/components/dodge-field)                     | Wrapper that makes any child dodge the pointer until it relents and glides home.                                                                                       |
| [Dome Gallery](https://nxui.geoql.in/docs/components/dome-gallery)                   | Immersive 3D dome gallery projecting images on a hemispheric surface; drag to spin with inertia, click a tile to open it.                                              |
| [Drag Reorder List](https://nxui.geoql.in/docs/components/drag-reorder-list)         | Drag-to-reorder list with lift, velocity tilt, spring-shifting siblings, and an empty-space cutout marking the drop slot.                                              |
| [Drift Wall](https://nxui.geoql.in/docs/components/drift-wall)                       | An endless 3D wall of image tiles drifting in alternating columns, lifting a tile toward you on hover or focus.                                                        |
| [Dynamic Island Header](https://nxui.geoql.in/docs/components/dynamic-island-header) | Navbar that collapses into a compact pill on scroll, morphing to show the active section and reading progress.                                                         |
| [Elastic Slider](https://nxui.geoql.in/docs/components/elastic-slider)               | A slider that grows under the cursor and stretches like rubber when pulled past either end, then springs back.                                                         |
| [Eye Tracking](https://nxui.geoql.in/docs/components/eye-tracking)                   | Animated eyes that follow your cursor with realistic blinking, reactive pupils, and idle micro-movements. Supports realistic, cartoon, minimal, and cyber variants.    |
| [Flex Carousel](https://nxui.geoql.in/docs/components/flex-carousel)                 | An infinite WebGL image row that bends, twists and splits into rainbow light where it crosses an invisible glass lens.                                                 |
| [Flight Status Card](https://nxui.geoql.in/docs/components/flight-status-card)       | An animated card displaying real-time flight information with progress tracking.                                                                                       |
| [Flip Card](https://nxui.geoql.in/docs/components/flip-card)                         | Two-faced card that flips in 3D on a click, drag or flick and settles on a spring.                                                                                     |
| [Flowing Menu](https://nxui.geoql.in/docs/components/flowing-menu)                   | A full-height menu with one liquid band that glides and stretches between rows and reveals a scrolling marquee of each item.                                           |
| [Fluid Glass](https://nxui.geoql.in/docs/components/fluid-glass)                     | A glass object that refracts your headline, image or video, follows the cursor and melts between seven shapes.                                                         |
| [Flying Posters](https://nxui.geoql.in/docs/components/flying-posters)               | 3D posters that twist and flip as you scroll or drag through an endless column.                                                                                        |
| [Folder](https://nxui.geoql.in/docs/components/folder)                               | 3D folder that drops its flap open or swings open like a book, in solid, glass or matte, with pages you can zoom, drag out and drop back in.                           |
| [Folder Float](https://nxui.geoql.in/docs/components/folder-float)                   | Folder whose notes spring out into a floating cloud on hover or press; once landed they drift and can be dragged and thrown.                                           |
| [Frosted Navigation](https://nxui.geoql.in/docs/components/frosted-navigation)       | Bottom navigation where content melts into a progressive frosted-glass gradient, with a serif search pill and spring-animated tabs.                                    |
| [Github Calendar](https://nxui.geoql.in/docs/components/github-calendar)             | A premium, customizable visualization of GitHub contribution graphs with multiple color schemes and display variants.                                                  |
| [Glass Icons](https://nxui.geoql.in/docs/components/glass-icons)                     | Liquid glass icons that bend the color behind them, for app grids, docks and social links.                                                                             |
| [Glass Surface](https://nxui.geoql.in/docs/components/glass-surface)                 | Liquid glass that bends what is behind it, in a rounded panel or any logo shape, with SVG or WebGL refraction.                                                         |
| [Glide Select](https://nxui.geoql.in/docs/components/glide-select)                   | Select chip whose menu pops from its corner and whose highlight glides between rows.                                                                                   |
| [Gooey Dropdown](https://nxui.geoql.in/docs/components/gooey-dropdown)               | A pill trigger whose menu items stretch out of it with a gooey metaball merge before snapping into discrete buttons.                                                   |
| [Gooey Nav](https://nxui.geoql.in/docs/components/gooey-nav)                         | A navigation bar whose active pill breaks into goo that flows over to the item you pick.                                                                               |
| [Holo Card](https://nxui.geoql.in/docs/components/holo-card)                         | Trading card with a WebGL holographic foil, glittering border and pointer tilt. Optional back face flips on click.                                                     |
| [Holo Cloth](https://nxui.geoql.in/docs/components/holo-cloth)                       | A grabbable sheet of simulated cloth draped in an iridescent holo-foil material, floating in zero gravity.                                                             |
| [Holo Sticker](https://nxui.geoql.in/docs/components/holo-sticker)                   | A die-cut holographic sticker rendered in WebGL: rainbow foil sweeps with your cursor, embossed ink relief, page-curled peel, and exploded production layers.          |
| [Hover Transition](https://nxui.geoql.in/docs/components/hover-transition)           | A focusable wrapper that swaps a default and a hover slot with one of eight transitions from nine directions, plus a light tilt and glare.                             |
| [Infinite Menu](https://nxui.geoql.in/docs/components/infinite-menu)                 | A draggable WebGL sphere of image tiles that snaps the nearest tile forward and shows its title, description and link.                                                 |
| [Infinite Spiral](https://nxui.geoql.in/docs/components/infinite-spiral)             | An endlessly looping 3D helix of image cards that plays by itself, follows a drag or follows page scroll.                                                              |
| [Jelly Radio](https://nxui.geoql.in/docs/components/jelly-radio)                     | Radio group of chips where the chosen one swells and barges its neighbours outward.                                                                                    |
| [Lanyard](https://nxui.geoql.in/docs/components/lanyard)                             | Swinging 3D badge on a stretchy woven band that you can drag, throw or click to flip.                                                                                  |
| [Lattice Loader](https://nxui.geoql.in/docs/components/lattice-loader)               | Agent status row with a lattice of cells that brighten in a wave beside a live stopwatch.                                                                              |
| [Layered Stack](https://nxui.geoql.in/docs/components/layered-stack)                 | Stack of cards that fans out on hover, stacking back with random rotation on mouse leave.                                                                              |
| [Lens Clock](https://nxui.geoql.in/docs/components/lens-clock)                       | A live clock that frames a corner of a large dial, panning with the hour hand while the edges blur out of focus.                                                       |
| [Line Sidebar](https://nxui.geoql.in/docs/components/line-sidebar)                   | List navigation with a marker rail; items near the cursor shift, tint and grow their markers, and the clicked item stays lit.                                          |
| [Liquid Glass Carousel](https://nxui.geoql.in/docs/components/liquid-glass-carousel) | Infinite scroll-driven portfolio carousel drawn through a liquid-glass lens, with focus mode and an entry animation.                                                   |
| [Mac Keyboard](https://nxui.geoql.in/docs/components/mac-keyboard)                   | An interactive Mac keyboard with real key tracking, sound effects, and visual feedback. Press keys on your keyboard to see them light up.                              |
| [Magic Bento](https://nxui.geoql.in/docs/components/magic-bento)                     | A bento grid of feature cards with live artwork, edge light that follows the cursor and a click wave across the grid.                                                  |
| [Magnetic Dock](https://nxui.geoql.in/docs/components/magnetic-dock)                 | A macOS-style dock with magnetic hover magnification and genie effect.                                                                                                 |
| [Masonry](https://nxui.geoql.in/docs/components/masonry)                             | A masonry gallery that springs tiles into place, reflows on resize, reorders by drag and opens images in a lightbox.                                                   |
| [Model Viewer](https://nxui.geoql.in/docs/components/model-viewer)                   | A 3D model viewer for glb, gltf, fbx and obj files that frames the model, lights it with an HDRI and floats it over a soft shadow.                                     |
| [Morph Slider](https://nxui.geoql.in/docs/components/morph-slider)                   | WebGL image slider that melts, ripples, shears or swirls between slides, with drag scrubbing, autoplay, captions and dots.                                             |
| [Music Player](https://nxui.geoql.in/docs/components/music-player)                   | An interactive vinyl-record music player with swinging tonearm and animated rotation.                                                                                  |
| [Newsletter Bookshelf](https://nxui.geoql.in/docs/components/newsletter-bookshelf)   | A three.js shelf of cloth-bound books for a newsletter archive. Browse sideways, hover to lift a spine, click to pull a book forward.                                  |
| [Node Canvas](https://nxui.geoql.in/docs/components/node-canvas)                     | A pannable, zoomable node canvas with draggable nodes, live bezier edges, selection handles, a minimap and a zoom control.                                             |
| [Node Diagram](https://nxui.geoql.in/docs/components/node-diagram)                   | An animated node diagram with glowing data pulses flowing through connections.                                                                                         |
| [Nostalgia](https://nxui.geoql.in/docs/components/nostalgia)                         | Vintage slide-viewer that cycles through memories while a fan of polaroid thumbnails arcs around it and a year + serif title crossfade underneath.                     |
| [Notification Center](https://nxui.geoql.in/docs/components/notification-center)     | Frosted notification panel with badged bell trigger, spring-animated rows that expand in place, and live relative timestamps.                                          |
| [Option Wheel](https://nxui.geoql.in/docs/components/option-wheel)                   | Curved option picker that spins with scroll, drag or arrow keys, tilting items away.                                                                                   |
| [Orbit Card Stack](https://nxui.geoql.in/docs/components/orbit-card-stack)           | A stacked deck of profile cards that fans out into an orbital arc on hover, lifting the active card with spring physics.                                               |
| [Orbit Images](https://nxui.geoql.in/docs/components/orbit-images)                   | Photos travel along an SVG path with depth, passing behind and in front of center content. Drag to spin, click to bring one forward.                                   |
| [Paper Crumple](https://nxui.geoql.in/docs/components/paper-crumple)                 | An image on a 3D paper sheet that crumples into a ball while you hold it, follows the pointer as you drag, and unfolds on release.                                     |
| [Peek Rating](https://nxui.geoql.in/docs/components/peek-rating)                     | Star rating that lifts a wave of stars up to the pointer, then commits with a pop on click.                                                                            |
| [Pill Nav](https://nxui.geoql.in/docs/components/pill-nav)                           | A pill nav bar where a fill rises through each link as its label rolls over, with a sliding active dot and a menu that folds in on small screens.                      |
| [Pixel Card](https://nxui.geoql.in/docs/components/pixel-card)                       | A card whose canvas pixels reveal in a glowing wave from the center or cursor, on hover, click or always on, with a cursor spotlight.                                  |
| [PlayStation Navbar](https://nxui.geoql.in/docs/components/playstation-navbar)       | XMB-style cross-media navigation with a sliding category rail, glowing pill cursor, and full arrow-key control.                                                        |
| [Podcast Player](https://nxui.geoql.in/docs/components/podcast-player)               | Expandable podcast episode card driving a real audio element — waveform seek with hover scrubber, chapters, speed cycling, volume, and a compact pill mode.            |
| [Profile Card](https://nxui.geoql.in/docs/components/profile-card)                   | A framed profile card that tilts toward the cursor, with holographic foil shining through a tiled pattern.                                                             |
| [Progress Stepper](https://nxui.geoql.in/docs/components/progress-stepper)           | A vertical process timeline with a single rail, spinning in-progress markers, drawn-in checks and nested sub-steps that unfold under the active step.                  |
| [Prompt Bar](https://nxui.geoql.in/docs/components/prompt-bar)                       | Chat composer with @ sources, / commands, a model picker, an effort slider, dictation and attachment chips.                                                            |
| [Pulse Heart](https://nxui.geoql.in/docs/components/pulse-heart)                     | Like button whose glyph contracts to a dot, flips colour and swells back while the pill beats and the count rolls over.                                                |
| [Receipt Printer](https://nxui.geoql.in/docs/components/receipt-printer)             | A checkout state that turns payment processing into a printed order receipt — stepped paper feed, status screen, serrated paper tear.                                  |
| [Refine Frame](https://nxui.geoql.in/docs/components/refine-frame)                   | Media frame that steps an image through generation stages, from a coarse mosaic to sharp, without any layout shift.                                                    |
| [Reflective Card](https://nxui.geoql.in/docs/components/reflective-card)             | A WebGL2 metal ID card that reflects a looping video or your camera, tilts toward the cursor and catches a moving light.                                               |
| [Ripple Transition](https://nxui.geoql.in/docs/components/ripple-transition)         | WebGL image transitions with noisy refractive waves, chromatic edges, glow, and click-triggered ripple origins.                                                        |
| [Rubber Segment](https://nxui.geoql.in/docs/components/rubber-segment)               | Segmented control whose rubber thumb stretches across the gap and squashes into place.                                                                                 |
| [Scroll Choreography](https://nxui.geoql.in/docs/components/scroll-choreography)     | Scroll-driven image choreography with diagonal movement, stacking, and hero expansion phases.                                                                          |
| [Scroll Split Card](https://nxui.geoql.in/docs/components/scroll-split-card)         | Scroll-driven card that splits into 3 panels and flips to reveal content.                                                                                              |
| [Scroll Stack](https://nxui.geoql.in/docs/components/scroll-stack)                   | Cards pin and stack as you scroll, settling back into a dimmed deck with smooth, jitter-free motion.                                                                   |
| [Scroll Tilted Grid](https://nxui.geoql.in/docs/components/scroll-tilted-grid)       | A two-column image gallery whose frames tilt, blur and dim at the viewport edges and settle into focus as they cross the center.                                       |
| [Scrub Field](https://nxui.geoql.in/docs/components/scrub-field)                     | Number chip you drag to scrub, with rubber-band limits and click to type.                                                                                              |
| [Scrub Input](https://nxui.geoql.in/docs/components/scrub-input)                     | An inline slider input styled as a pill, perfect for adjusting variables smoothly.                                                                                     |
| [Showcase Card](https://nxui.geoql.in/docs/components/showcase-card)                 | A card with 3D tilt effect that responds to mouse movement for showcasing content.                                                                                     |
| [Shredder](https://nxui.geoql.in/docs/components/shredder)                           | A list with a paper shredder at the bottom that cuts dragged rows into curling strips.                                                                                 |
| [Signature](https://nxui.geoql.in/docs/components/signature)                         | Animated handwriting effect that converts text to font glyph paths and reveals them with staggered SVG stroke animations.                                              |
| [Signature Eraser](https://nxui.geoql.in/docs/components/signature-eraser)           | A signing canvas whose ink disintegrates into five physics-based particle effects.                                                                                     |
| [Slide Commit](https://nxui.geoql.in/docs/components/slide-commit)                   | Slide-to-confirm handle that spins while your action runs, then unfurls into a done pill or shakes back on failure.                                                    |
| [Slosh Gauge](https://nxui.geoql.in/docs/components/slosh-gauge)                     | Tank gauge whose liquid chases the value on a spring, tilts as it moves and splashes when it fills.                                                                    |
| [Specular Button](https://nxui.geoql.in/docs/components/specular-button)             | Glass button with a WebGL2 rim light that rests on a corner, glides around the edge toward the cursor and flashes on press.                                            |
| [Spiral 3D Slider](https://nxui.geoql.in/docs/components/spiral-3d-slider)           | An autoplaying image gallery that flows along a 3D spiral of curved WebGL planes and moves with wheel and page scroll.                                                 |
| [Split Flap Display](https://nxui.geoql.in/docs/components/split-flap-display)       | An airport-style split flap display with staggered character flip animations and configurable rows.                                                                    |
| [Spotlight Card](https://nxui.geoql.in/docs/components/spotlight-card)               | Card lit by a soft spotlight that follows the pointer, catches its edge and reaches nearby cards.                                                                      |
| [Spring Check](https://nxui.geoql.in/docs/components/spring-check)                   | A checkbox row where one spring fills the box, draws the tick and strikes through the label.                                                                           |
| [Squish Switch](https://nxui.geoql.in/docs/components/squish-switch)                 | Switch whose thumb stretches with speed and squashes against the end when you flick it.                                                                                |
| [Stack](https://nxui.geoql.in/docs/components/stack)                                 | Pile of cards you can drag, flick or click through, with thrown cards tucking underneath.                                                                              |
| [Stacked List](https://nxui.geoql.in/docs/components/stacked-list)                   | A media list that rests as an overlapping deck and fans into a full column on hover, with the first row anchoring the stack.                                           |
| [Staggered Menu](https://nxui.geoql.in/docs/components/staggered-menu)               | Side menu whose color layers slide in one after another, then links rise in with a staggered tilt as the toggle rolls from Menu to Close.                              |
| [Status Mark](https://nxui.geoql.in/docs/components/status-mark)                     | Agent task status glyph that morphs from an idle ring to a progress arc, then a check.                                                                                 |
| [Stepper](https://nxui.geoql.in/docs/components/stepper)                             | A multi-step flow in a frosted panel with a gliding step indicator, spring transitions and number, dot, bar or vertical layouts.                                       |
| [Sticky Scroll Cards](https://nxui.geoql.in/docs/components/sticky-scroll-cards)     | Scroll-driven card stack where images pin and scale as you scroll.                                                                                                     |
| [Swipe Row](https://nxui.geoql.in/docs/components/swipe-row)                         | List row you swipe to reveal a drawer of actions; a full swipe leaps the delete block across and folds the row away.                                                   |
| [Swipe Toast](https://nxui.geoql.in/docs/components/swipe-toast)                     | Toast that swipes down to dismiss and burns a thin fuse along its edge for the time it has left.                                                                       |
| [Tear Ticket](https://nxui.geoql.in/docs/components/tear-ticket)                     | A ticket whose perforated stub tears off by hand, fibre by fibre, then drops away and leaves a greyed, used ticket.                                                    |
| [Testimonial Marquee](https://nxui.geoql.in/docs/components/testimonial-marquee)     | An infinite scrolling marquee of testimonial cards with smooth animation.                                                                                              |
| [Thought Line](https://nxui.geoql.in/docs/components/thought-line)                   | Reasoning trace header with a breathing glyph and live clock that folds its steps into one line when the work settles.                                                 |
| [Tilted Card](https://nxui.geoql.in/docs/components/tilted-card)                     | A 3D card that tilts toward the cursor, with glare, a soft shadow, floating depth layers and a flip side.                                                              |
| [Timezone Companion](https://nxui.geoql.in/docs/components/timezone-companion)       | A meeting-overlap finder: a 24-hour grid of city working hours with a draggable scrubber and a find-best-time sweep.                                                   |
| [Visual Stepper](https://nxui.geoql.in/docs/components/visual-stepper)               | Auto-playing vertical stepper with growing connector bars and a crossfading preview card.                                                                              |
| [Voice Pill](https://nxui.geoql.in/docs/components/voice-pill)                       | Mic button that opens into a capsule with a scrolling waveform and a timer while recording; tap to latch, hold to talk, slide left to cancel.                          |
| [Wake Slider](https://nxui.geoql.in/docs/components/wake-slider)                     | Thumbless range slider of thin bars where drag speed raises a wake behind the handle.                                                                                  |
| [Warm Tooltip](https://nxui.geoql.in/docs/components/warm-tooltip)                   | A tooltip group where the first label waits, then siblings open instantly and the label glides between triggers while warm.                                            |
| [Weather Forecast](https://nxui.geoql.in/docs/components/weather-forecast)           | A weather card with a colored condition orb glowing behind frosted glass, unit toggle, and hover-driven day chips.                                                     |
| [Wheel Carousel](https://nxui.geoql.in/docs/components/wheel-carousel)               | A rotating-wheel picker with inertial drag and scroll, curved fading labels, and a crossfading image for the active item.                                              |

### Backgrounds (65)

| Component                                                                 | Description                                                                                                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Acid Squares](https://nxui.geoql.in/docs/backgrounds/acid-squares)       | A rolling WebGL field of glossy squares that ripples under two drifting colored lights, with cursor press and click ripples.                      |
| [AeroShards](https://nxui.geoql.in/docs/backgrounds/aero-shards)          | Silk ribbons of thick glass shards streaming on layered depths among survey markers, catching light along their edges.                            |
| [Antigravity](https://nxui.geoql.in/docs/backgrounds/antigravity)         | A field of particles that lifts into a glowing ring around the cursor and bursts outward on click.                                                |
| [Aurora](https://nxui.geoql.in/docs/backgrounds/aurora)                   | A soft, calm aurora that flows across the top of the page and drifts toward the cursor.                                                           |
| [Balatro](https://nxui.geoql.in/docs/backgrounds/balatro)                 | The swirling Balatro paint shader with crisp pixels, a cursor that stirs the paint, click whirlpools and an optional CRT look.                    |
| [Ballpit](https://nxui.geoql.in/docs/backgrounds/ballpit)                 | A soft-lit pit of physics balls you can shove with the cursor, grab, throw and blast apart.                                                       |
| [Beams](https://nxui.geoql.in/docs/backgrounds/beams)                     | Glossy ribbons that ripple and catch a glowing light, which follows your cursor along the beams.                                                  |
| [Color Bends](https://nxui.geoql.in/docs/backgrounds/color-bends)         | Bands of color that bend and fold into each other in a slow, flowing warp that leans toward the cursor.                                           |
| [CRT Warp](https://nxui.geoql.in/docs/backgrounds/crt-warp)               | A blocky plasma glowing on a curved CRT, with scanlines, a phosphor mask, afterglow, a power-on intro, cursor magnet and click-to-change channel. |
| [Dark Veil](https://nxui.geoql.in/docs/backgrounds/dark-veil)             | A silky veil of light that drifts in the dark and bends around the cursor, in any color, with a light-mode ink variant.                           |
| [Dither](https://nxui.geoql.in/docs/backgrounds/dither)                   | Retro dithered waves with Bayer, halftone, line, crosshatch and noise patterns, palettes, cursor trails and click ripples.                        |
| [Dot Field](https://nxui.geoql.in/docs/backgrounds/dot-field)             | A gradient dot field seen through a lens that follows the cursor, magnifying, pinching or swirling the dots.                                      |
| [Dot Grid](https://nxui.geoql.in/docs/backgrounds/dot-grid)               | A springy dot grid that the cursor flicks and drags through like jelly, with click shockwaves.                                                    |
| [Evil Eye](https://nxui.geoql.in/docs/backgrounds/evil-eye)               | Procedural evil eye shader with an animated iris, a slit pupil that follows the cursor, and a fiery outer glow.                                   |
| [Faulty Terminal](https://nxui.geoql.in/docs/backgrounds/faulty-terminal) | A flickering CRT terminal of glowing glyphs, with phosphor trails under the cursor and glitches on click.                                         |
| [Ferrofluid](https://nxui.geoql.in/docs/backgrounds/ferrofluid)           | A glossy sea of magnetic fluid where swells of spikes roll in, the cursor raises a crown and clicks send out a ring of spikes.                    |
| [Floating Lines](https://nxui.geoql.in/docs/backgrounds/floating-lines)   | Waves of fine glowing lines that drift, part around the cursor and curl into a swirl when you click.                                              |
| [Flux Lines](https://nxui.geoql.in/docs/backgrounds/flux-lines)           | Glowing flux lines trace a churning magnetic fluid. The cursor acts as a magnet that reveals and curls the lines, and a click stirs a swirl.      |
| [Galaxy](https://nxui.geoql.in/docs/backgrounds/galaxy)                   | Endless flight through a twinkling starfield with warp jumps, cursor repulsion and star palettes.                                                 |
| [Ghost Fibers](https://nxui.geoql.in/docs/backgrounds/ghost-fibers)       | Layered ribbons of fine glowing fibers that twist, fold and drift through soft depth of field.                                                    |
| [Gradient ASCII](https://nxui.geoql.in/docs/backgrounds/gradient-ascii)   | Soft gradient glows drawn in ASCII characters that scramble under the cursor.                                                                     |
| [Gradient Blinds](https://nxui.geoql.in/docs/backgrounds/gradient-blinds) | Satin gradient blinds lit by a cursor spotlight that sway, turn toward the light and ripple on click.                                             |
| [Gradient Waves](https://nxui.geoql.in/docs/backgrounds/gradient-waves)   | Ray-marched satin waves rolling in from a hazy horizon, with a light that follows the cursor and a swell on click.                                |
| [Grainient](https://nxui.geoql.in/docs/backgrounds/grainient)             | Flowing grainy gradient that you drag like paint with the cursor and twist into swirls with a click.                                              |
| [Grid Distortion](https://nxui.geoql.in/docs/backgrounds/grid-distortion) | Image background that breaks into a grid of blocks under the cursor and settles back into place.                                                  |
| [Grid Motion](https://nxui.geoql.in/docs/backgrounds/grid-motion)         | A tilted wall of drifting tiles that slides with the pointer and lights up where it rests.                                                        |
| [Grid Scan](https://nxui.geoql.in/docs/backgrounds/grid-scan)             | A lit 3D grid room swept by a scanning light. The view shifts with the cursor and clicks send a ping across the walls.                            |
| [Hyperspeed](https://nxui.geoql.in/docs/backgrounds/hyperspeed)           | Night highway of glowing light trails on a winding road that warps into hyperspace while you hold the pointer down.                               |
| [Iridescence](https://nxui.geoql.in/docs/backgrounds/iridescence)         | Liquid iridescent surface with shifting folds that you can stir with the cursor.                                                                  |
| [Laser Flow](https://nxui.geoql.in/docs/backgrounds/laser-flow)           | A beam of light that drops onto your content, runs along its top edge and pours over its corners, with a cursor reveal.                           |
| [Letter Glitch](https://nxui.geoql.in/docs/backgrounds/letter-glitch)     | A calm field of letters that flicker, scramble and glitch in color, stirred by the cursor and torn by clicks.                                     |
| [Light Pillar](https://nxui.geoql.in/docs/backgrounds/light-pillar)       | A swirling pillar of light that ignites on load, leans toward the cursor and surges on click.                                                     |
| [Light Rays](https://nxui.geoql.in/docs/backgrounds/light-rays)           | Volumetric light rays from any edge with source glow and haze. The cursor steers the beam and casts a shadow; clicks send a wave of light.        |
| [Light Tunnel](https://nxui.geoql.in/docs/backgrounds/light-tunnel)       | A swirling fibre-optic tunnel where comets of light race into depth, steered by the cursor.                                                       |
| [Lightfall](https://nxui.geoql.in/docs/backgrounds/lightfall)             | Streaks of light falling down a curved tunnel, bending around the cursor and stretching into warp trails on hold.                                 |
| [Lightning](https://nxui.geoql.in/docs/backgrounds/lightning)             | Crackling, branching lightning that bends toward the cursor and strikes wherever you click.                                                       |
| [Line Waves](https://nxui.geoql.in/docs/backgrounds/line-waves)           | Fine lines that flow in silky waves while a band of light drifts through them, with a cursor spotlight and click ripples.                         |
| [Liquid Chrome](https://nxui.geoql.in/docs/backgrounds/liquid-chrome)     | Soft ribbons of liquid chrome that swirl through a dark pool, ripple under the cursor and catch the light as it moves.                            |
| [Liquid Ether](https://nxui.geoql.in/docs/backgrounds/liquid-ether)       | A glowing liquid that swirls under the cursor, colored by how fast it flows, with an intro sweep, click puffs and a light mode.                   |
| [Metallic Paint](https://nxui.geoql.in/docs/backgrounds/metallic-paint)   | Liquid chrome that flows over a logo or text, bends around its edges, tilts with the cursor and pours in on load.                                 |
| [Micro Slats](https://nxui.geoql.in/docs/backgrounds/micro-slats)         | A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests and a cursor-stirred fluid trail.                            |
| [Molten Metal](https://nxui.geoql.in/docs/backgrounds/molten-metal)       | Swirling caustic filaments with white-hot cores that ignite on load, heat up under the cursor and flare on click.                                 |
| [Orb](https://nxui.geoql.in/docs/backgrounds/orb)                         | A glowing ring of swirling color that breathes, trails an orbiting light, reaches toward the cursor and pulses on click.                          |
| [Particles](https://nxui.geoql.in/docs/backgrounds/particles)             | A drifting 3D field of particles with glow, twinkle, constellation lines, drift modes and cursor repel, attract or parallax.                      |
| [Pattern Waves](https://nxui.geoql.in/docs/backgrounds/pattern-waves)     | A lit halftone surface of dots, lines or glyphs that moves like draped silk and ripples under the cursor.                                         |
| [Pixel Blast](https://nxui.geoql.in/docs/backgrounds/pixel-blast)         | Dithered pixel clouds that drift, shimmer and light up under the cursor, with ripples, six shapes and a perspective floor.                        |
| [Pixel Snow](https://nxui.geoql.in/docs/backgrounds/pixel-snow)           | Pixel-art snowflakes drifting down in layers of depth, brushed aside by the cursor.                                                               |
| [Plasma](https://nxui.geoql.in/docs/backgrounds/plasma)                   | Soft folds of satin light twisting slowly through the dark, turning in 3D to follow the cursor.                                                   |
| [Plasma Wave](https://nxui.geoql.in/docs/backgrounds/plasma-wave)         | Two ribbons of plasma curling through each other, with soft glow and white-hot cores.                                                             |
| [Prism](https://nxui.geoql.in/docs/backgrounds/prism)                     | Rotating prism of glowing spectral light that tilts toward the cursor, with custom colors, shape, motion and a light mode.                        |
| [Prismatic Burst](https://nxui.geoql.in/docs/backgrounds/prismatic-burst) | A burst of prismatic light rays that leans toward the cursor and sends a wave of light outward on click.                                          |
| [Radar](https://nxui.geoql.in/docs/backgrounds/radar)                     | A radar scope whose sweep leaves a phosphor afterglow, lights up clutter and pings moving contacts. Sonar and tilted floor modes.                 |
| [Ripple Grid](https://nxui.geoql.in/docs/backgrounds/ripple-grid)         | A crisp grid that ripples like water, bending and lighting up as waves pass through it, with dot, cross and floor styles.                         |
| [Scanner](https://nxui.geoql.in/docs/backgrounds/scanner)                 | Glowing interference lines swept by a scan beam, with a CRT finish, cursor lensing and click pings.                                               |
| [Shape Grid](https://nxui.geoql.in/docs/backgrounds/shape-grid)           | A drifting grid of shapes that lights up under the cursor, with perspective tilt, rainbow trails and click ripples.                               |
| [Shape Waves](https://nxui.geoql.in/docs/backgrounds/shape-waves)         | A grid of triangles, circles and squares that morph and grow along noise waves, with text cutouts and cursor splash ripples.                      |
| [Side Rays](https://nxui.geoql.in/docs/backgrounds/side-rays)             | Shafts of light that fan in from a corner or side, shimmer slowly and lean toward the cursor.                                                     |
| [Silk](https://nxui.geoql.in/docs/backgrounds/silk)                       | Flowing satin folds with glossy highlights that turn toward the cursor and ripple on click.                                                       |
| [Sliced Waves](https://nxui.geoql.in/docs/backgrounds/sliced-waves)       | Waves of colored light sliced into glowing bars in depth, with a depth-of-field focus that follows the cursor.                                    |
| [Soft Aurora](https://nxui.geoql.in/docs/backgrounds/soft-aurora)         | Soft aurora band built from 3D Perlin noise that reaches toward the cursor and carries click pulses.                                              |
| [Squares](https://nxui.geoql.in/docs/backgrounds/squares)                 | Animated grid of squares with directional movement and hover interaction.                                                                         |
| [Threads](https://nxui.geoql.in/docs/backgrounds/threads)                 | Flowing threads that fray apart and part around the cursor, from fine silk to contour lines.                                                      |
| [Topography](https://nxui.geoql.in/docs/backgrounds/topography)           | A 3D landscape drawn in glowing contour lines that rises under the cursor, with light pulses on click.                                            |
| [Waves](https://nxui.geoql.in/docs/backgrounds/waves)                     | Dense flowing lines that sway like silk, bend around the cursor and spring back, with click ripples, dashed lines and rotation.                   |
| [Web Threads](https://nxui.geoql.in/docs/backgrounds/web-threads)         | Glowing threads woven through pinch points that draw in one by one, light up under the cursor and carry light on click.                           |

### Hero Backgrounds (9)

| Component                                                                          | Description                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Animated Gradient](https://nxui.geoql.in/docs/hero-backgrounds/animated-gradient) | A beautiful, animated, and customizable WebGL gradient with noise capabilities. Supports built-in presets (Aurora, Oceanic, Amber, Toxic, Ghost) and fully custom configurations. |
| [Aurora Flow](https://nxui.geoql.in/docs/hero-backgrounds/aurora-flow)             | WebGL hero background with layered silk flow, diffused aurora light, film grain and a soft pointer bend, with twelve palette presets.                                             |
| [Dither Prism Hero](https://nxui.geoql.in/docs/hero-backgrounds/dither-prism-hero) | A prismatic dithered hero section with advanced WebGL shaders featuring ordered dithering, holographic iridescence, and floating particles.                                       |
| [Grain Gradient](https://nxui.geoql.in/docs/hero-backgrounds/grain-gradient)       | A breathing color field with a soft curved shadow, flowing light and fine film grain, drawn with WebGL.                                                                           |
| [Hero Geometric](https://nxui.geoql.in/docs/hero-backgrounds/hero-geometric)       | A dithered geometric gradient hero section powered by Three.js shaders with simplex noise and Bayer dithering.                                                                    |
| [Prism Gradient](https://nxui.geoql.in/docs/hero-backgrounds/prism-gradient)       | WebGL2 hero gradient — three colors swirled through sixteen iterations of sinusoidal distortion, tracking light and dark mode automatically.                                      |
| [Silk Aurora](https://nxui.geoql.in/docs/hero-backgrounds/silk-aurora)             | Premium WebGL hero with satin-dark aurora ribbons, pearlescent highlights, fine film grain, and cursor depth that bends the light toward the pointer.                             |
| [Spectral Ribbon](https://nxui.geoql.in/docs/hero-backgrounds/spectral-ribbon)     | A soft spectral light ribbon on black with slow liquid motion and a rainbow fringe, drawn by one WebGL fragment shader.                                                           |
| [WebGL Liquid](https://nxui.geoql.in/docs/hero-backgrounds/webgl-liquid)           | A premium liquid hero background powered by raw WebGL shaders, with configurable palette, grain, reveal timing, and flow behavior.                                                |

### Dashboard (8)

| Component                                                             | Description                                                                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Clean Table](https://nxui.geoql.in/docs/dashboard/clean-table)       | A quiet, paginated table with segmented tabs, a keyboard-focused search, zebra rows, mono columns, status pills and row selection.      |
| [Control Card](https://nxui.geoql.in/docs/dashboard/control-card)     | A frosted-glass device card with a round power button, a device name and a boxed stat, made to sit over a photo.                        |
| [Data Table](https://nxui.geoql.in/docs/dashboard/data-table)         | A sortable, searchable table on TanStack Table with cell slots and a flash on rows whose values change.                                 |
| [Downtime Log](https://nxui.geoql.in/docs/dashboard/downtime-log)     | A machine downtime log with selectable stops, reason pills, a reason filter, sort modes and a 24-hour stop timeline linked to the rows. |
| [KPI Card](https://nxui.geoql.in/docs/dashboard/kpi-card)             | A metric card with a tinted icon, an actions button, a counting value and a stack of avatars or initials.                               |
| [KPI Carousel](https://nxui.geoql.in/docs/dashboard/kpi-carousel)     | A titled panel of best, worst and neutral metric cards with tone tints, arrows, dots and peeking neighbours.                            |
| [Range Calendar](https://nxui.geoql.in/docs/dashboard/range-calendar) | A month heatmap calendar for picking a date range, with presets, a live range pill, a shaded legend and a compare switch.               |
| [Status Panel](https://nxui.geoql.in/docs/dashboard/status-panel)     | Service health lamps with an overall status, uptime and latency, plus a live event log.                                                 |

### Charts (8)

Dependency-free SVG charts with the [TanStack Charts](https://tanstack.com/charts) API. Swap to `@tanstack/vue-charts` by editing one file — see any chart's docs page.

| Component                                                              | Description                                                                                                                                              |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Area Chart](https://nxui.geoql.in/docs/charts/area-chart)             | A responsive area chart with axes and grid lines whose values rise from the baseline on mount.                                                           |
| [Beeswarm Chart](https://nxui.geoql.in/docs/charts/beeswarm-chart)     | A cycle-time beeswarm dot plot with a machine switch, median and takt lines, a hatched over-takt zone, an axis break and an on-takt footer.              |
| [Donut Chart](https://nxui.geoql.in/docs/charts/donut-chart)           | A donut chart that sweeps in clockwise, with a counting total in the center and a legend that lifts its slice on hover.                                  |
| [Iso Stacked Bars](https://nxui.geoql.in/docs/charts/iso-stacked-bars) | An isometric 3D stacked bar chart: two rows of shaded, textured boxes on a floor plate, with tooltips, legend highlighting and a staggered grow-in.      |
| [Pattern Donut](https://nxui.geoql.in/docs/charts/pattern-donut)       | A two-ring donut: solid category slices inside, patterned cause segments outside, a hover-driven center label, a pinnable legend and a computed insight. |
| [Progress Ring](https://nxui.geoql.in/docs/charts/progress-ring)       | A circular progress indicator with rounded ends and a percentage that counts up with the ring.                                                           |
| [Radial Gauge](https://nxui.geoql.in/docs/charts/radial-gauge)         | A 270° gauge with a rounded value arc, threshold colors, and a readout that counts up to the value.                                                      |
| [Sparkline](https://nxui.geoql.in/docs/charts/sparkline)               | A compact trend line with a shaded area that rises into place, sized for KPI cards and table cells.                                                      |

### Visual Effects (14)

| Component                                                                                | Description                                                                                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Border Beam](https://nxui.geoql.in/docs/visual-effects/border-beam)                     | A moving gradient beam that travels along the border of its container. Perfect for highlighting active states.                   |
| [Closing Plasma](https://nxui.geoql.in/docs/visual-effects/closing-plasma)               | A premium footer-ready plasma background with atmospheric noise and smooth pointer-driven flow.                                  |
| [Dither Gradient](https://nxui.geoql.in/docs/visual-effects/dither-gradient)             | A dithered gradient effect rendered on canvas with customizable colors and animation.                                            |
| [Fisheye Infinite Grid](https://nxui.geoql.in/docs/visual-effects/fisheye-infinite-grid) | A draggable image wall that repeats on both axes and bends through one fisheye lens, with momentum, wheel and arrow-key panning. |
| [Image Ripple Effect](https://nxui.geoql.in/docs/visual-effects/image-ripple-effect)     | A WebGL-based image distortion effect that creates ripple waves on mouse hover using FBO ping-pong displacement mapping.         |
| [Infinite Image Field](https://nxui.geoql.in/docs/visual-effects/infinite-image-field)   | A camera-based infinite scrolling image grid on canvas, driven by cursor position with smooth velocity interpolation.            |
| [Liquid Blob](https://nxui.geoql.in/docs/visual-effects/liquid-blob)                     | A morphing liquid blob animation that follows the cursor with spring physics.                                                    |
| [Magnet Lines](https://nxui.geoql.in/docs/visual-effects/magnet-lines)                   | A field of magnetic lines that swing toward the cursor, ripple outward and spin with every click.                                |
| [Matrix Rain](https://nxui.geoql.in/docs/visual-effects/matrix-rain)                     | The iconic Matrix digital rain effect rendered on canvas with theme-aware colors.                                                |
| [Noise Texture](https://nxui.geoql.in/docs/visual-effects/noise-texture)                 | A subtle noise overlay that adds texture and depth to any container.                                                             |
| [Particle Galaxy](https://nxui.geoql.in/docs/visual-effects/particle-galaxy)             | A swirling 3D particle galaxy effect with spiral arms that responds to mouse movement.                                           |
| [Pixel Canvas](https://nxui.geoql.in/docs/visual-effects/pixel-canvas)                   | An interactive pixel grid canvas that responds to mouse movement with customizable colors.                                       |
| [Pixel Image Trail](https://nxui.geoql.in/docs/visual-effects/pixel-image-trail)         | An image reveal made from cursor-painted squares that expire into a bounded pixel trail.                                         |
| [Pixel Wave](https://nxui.geoql.in/docs/visual-effects/pixel-wave)                       | A looping pixel-art scene on a dark LED grid with four swappable presets (ocean, desert, hearth, mind).                          |

### Buttons (9)

| Component                                                                               | Description                                                                                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [Chaos Button](https://nxui.geoql.in/docs/buttons/chaos-button)                         | A pill button filled with drifting neon lines from a WebGL shader that tighten and scatter while pressed.                       |
| [Fizzy Button](https://nxui.geoql.in/docs/buttons/fizzy-button)                         | A button that starts to fizz as your pointer approaches, then floods with rising particles and inverts on hover.                |
| [Flying Button](https://nxui.geoql.in/docs/buttons/flying-button)                       | A button that fires thrusters on hover, lifts off on a WebGL2 smoke plume, can be dragged in flight and lands in its own cloud. |
| [Fuse Button](https://nxui.geoql.in/docs/buttons/fuse-button)                           | Action button that turns into an Undo while a fuse burns around the pill; hover pauses it and Escape cancels.                   |
| [Hold Button](https://nxui.geoql.in/docs/buttons/hold-button)                           | Hold-to-confirm button whose liquid fill with a wave crest sweeps across while pressed and snaps back if you let go.            |
| [Interactive Hover Button](https://nxui.geoql.in/docs/buttons/interactive-hover-button) | A button with a slide-and-reveal hover effect that transitions content and background.                                          |
| [Pulsating Button](https://nxui.geoql.in/docs/buttons/pulsating-button)                 | Vue port of the pulsating-button component from componentry.fun.                                                                |
| [Shimmer Button](https://nxui.geoql.in/docs/buttons/shimmer-button)                     | A button with a rotating shimmer/glow effect.                                                                                   |
| [Sling Button](https://nxui.geoql.in/docs/buttons/sling-button)                         | Send button you pull back like a slingshot and release to fire, with a stretching band, a power arc and a particle burst.       |

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
- [pnpm 12+](https://pnpm.io) (recommended: install via `corepack enable`)

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
