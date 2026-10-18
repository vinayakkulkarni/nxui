import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_DIR = join(ROOT, 'registry', 'new-york');
const OUTPUT_DIR = join(ROOT, 'public', 'r');

type RegistryItemType = 'registry:ui' | 'registry:lib';

interface RegistryFile {
  path: string;
  content: string;
  type: RegistryItemType;
  target: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: RegistryItemType;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

interface RegistryIndex {
  $schema: string;
  name: string;
  homepage: string;
  items: Array<{
    name: string;
    type: RegistryItemType;
    title: string;
    description: string;
  }>;
}

/**
 * Shared runtime installed once and referenced by all paper-* shaders via
 * registryDependencies. Full URL so the shadcn-vue CLI can resolve it from
 * this third-party registry regardless of how the consumer configured it.
 */
const PAPER_SHADER_MOUNT = 'paper-shader-mount';
const PAPER_SHADER_MOUNT_URL = `https://nxui.geoql.in/r/${PAPER_SHADER_MOUNT}.json`;

/**
 * Shared chart engine (hand-rolled, TanStack Charts-compatible API) installed
 * once and referenced by every chart component.
 */
const CHART_LIB = 'chart';
const CHART_LIB_URL = `https://nxui.geoql.in/r/${CHART_LIB}.json`;
const CHART_COMPONENTS = new Set([
  'area-chart',
  'donut-chart',
  'kpi-card',
  'progress-ring',
  'radial-gauge',
  'sparkline',
]);

const COMPONENTS: Record<
  string,
  { title: string; description: string; deps: string[] }
> = {
  'hyper-text': {
    title: 'Hyper Text',
    description:
      'A text component that scrambles letters before revealing the final text on hover or load.',
    deps: ['@vueuse/core'],
  },
  'kinetic-text-reveal': {
    title: 'Kinetic Text Reveal',
    description:
      'A kinetic text reveal that segments text into words, characters, or lines and animates each into place with configurable direction, stagger, and blur.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'text-animate': {
    title: 'Text Animate',
    description:
      'Versatile text animation component with multiple animation types and split modes.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'depth-dive': {
    title: 'Depth Dive',
    description:
      'A manifesto you scroll through: text sections float in 3D space, dissolve as you pass through them, and warp with scroll velocity.',
    deps: ['three'],
  },
  'true-focus': {
    title: 'True Focus',
    description:
      'Blurs every word but one and marks it with brackets, a box, an underline or a highlight that glides or springs between words.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'scroll-based-velocity': {
    title: 'Scroll Based Velocity',
    description:
      'Text marquee rows whose speed follows scroll velocity; rows can lean, stretch, be thrown with inertia and alternate outlined text.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'border-beam': {
    title: 'Border Beam',
    description:
      'A moving gradient beam that travels along the border of its container.',
    deps: ['motion-v'],
  },
  'noise-texture': {
    title: 'Noise Texture',
    description:
      'A canvas-based noise texture overlay for adding grain and texture to backgrounds.',
    deps: ['@vueuse/core'],
  },
  'fizzy-button': {
    title: 'Fizzy Button',
    description:
      'A button that starts to fizz as your pointer approaches, then floods with rising particles and inverts on hover.',
    deps: ['@vueuse/core'],
  },
  'chaos-button': {
    title: 'Chaos Button',
    description:
      'A pill button filled with drifting neon lines from a WebGL shader that tighten and scatter while pressed.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'shimmer-button': {
    title: 'Shimmer Button',
    description: 'A button with a shimmer/shine animation effect.',
    deps: [],
  },
  'interactive-hover-button': {
    title: 'Interactive Hover Button',
    description:
      'A button with an interactive hover state that reveals a secondary layer.',
    deps: [],
  },
  'spotlight-card': {
    title: 'Spotlight Card',
    description:
      'Card lit by a soft spotlight that follows the pointer, catches its edge and reaches nearby cards.',
    deps: ['@vueuse/core'],
  },
  'showcase-card': {
    title: 'Showcase Card',
    description: 'A card with 3D tilt effect that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  signature: {
    title: 'Signature',
    description:
      'Animated handwriting effect that converts text to font glyph paths and reveals them with staggered SVG stroke animations.',
    deps: ['opentype.js', '@vueuse/core', 'motion-v'],
  },
  'matrix-rain': {
    title: 'Matrix Rain',
    description: 'The iconic Matrix digital rain effect rendered on canvas.',
    deps: ['@vueuse/core'],
  },
  'pixel-canvas': {
    title: 'Pixel Canvas',
    description: 'An interactive pixel grid that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  'testimonial-marquee': {
    title: 'Testimonial Marquee',
    description: 'An infinite scrolling marquee of testimonial cards.',
    deps: [],
  },
  'magnet-lines': {
    title: 'Magnet Lines',
    description:
      'A field of magnetic lines that swing toward the cursor, ripple outward and spin with every click.',
    deps: ['@vueuse/core'],
  },
  'liquid-blob': {
    title: 'Liquid Blob',
    description: 'A morphing liquid blob that follows the cursor.',
    deps: ['@vueuse/core'],
  },
  'dither-gradient': {
    title: 'Dither Gradient',
    description: 'A dithered gradient effect rendered on canvas.',
    deps: ['@vueuse/core'],
  },
  'particle-galaxy': {
    title: 'Particle Galaxy',
    description:
      'A swirling 3D particle galaxy effect that responds to mouse movement.',
    deps: ['@vueuse/core'],
  },
  'node-diagram': {
    title: 'Node Diagram',
    description:
      'An animated node diagram with glowing data pulses flowing through connections.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'auth-modal': {
    title: 'Auth Modal',
    description:
      'An animated authentication modal with sign in and sign up tabs.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'command-menu': {
    title: 'Command Menu',
    description: 'A spotlight-style command palette with keyboard shortcuts.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'flight-status-card': {
    title: 'Flight Status Card',
    description: 'An animated card displaying real-time flight information.',
    deps: ['motion-v'],
  },
  'github-calendar': {
    title: 'GitHub Calendar',
    description:
      'A GitHub-style contribution heatmap calendar with optional top-contribution chips.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'art-gallery': {
    title: 'Art Gallery',
    description:
      'An editorial gallery where classic paintings alternate with headline text that melts into ink through a gooey SVG filter.',
    deps: [],
  },
  'magnetic-dock': {
    title: 'Magnetic Dock',
    description: 'A macOS-style dock with magnetic hover magnification effect.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'collection-surfer': {
    title: 'Collection Surfer',
    description:
      'A scroll-driven card carousel with parallax depth and momentum-based navigation.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'hero-geometric': {
    title: 'Hero Geometric',
    description:
      'A dithered geometric gradient hero section powered by Three.js shaders with simplex noise and Bayer dithering.',
    deps: ['three', 'motion-v', '@vueuse/core'],
  },
  'animated-gradient': {
    title: 'Animated Gradient',
    description:
      'A beautiful, animated, and customizable WebGL gradient with noise capabilities. Supports built-in presets and fully custom configurations.',
    deps: ['@vueuse/core'],
  },
  'dither-prism-hero': {
    title: 'Dither Prism Hero',
    description:
      'A prismatic dithered hero section with advanced WebGL shaders featuring ordered dithering, holographic iridescence, and floating particles.',
    deps: ['three', 'motion-v', '@vueuse/core'],
  },
  'webgl-liquid': {
    title: 'WebGL Liquid',
    description:
      'A premium liquid hero background powered by raw WebGL shaders, with configurable palette, grain, reveal timing, and flow behavior.',
    deps: ['@vueuse/core'],
  },
  'closing-plasma': {
    title: 'Closing Plasma',
    description:
      'A premium footer-ready plasma background with atmospheric noise and smooth pointer-driven flow.',
    deps: ['@vueuse/core'],
  },
  'pulsating-button': {
    title: 'Pulsating Button',
    description:
      'A button with a pulsating ring animation that draws attention.',
    deps: [],
  },
  'glitch-text': {
    title: 'Glitch Text',
    description:
      'Glitching text in four styles: sliced bands, jittering RGB split, a scanning tear or swapped glyphs, with intensity, skew, flicker and click bursts.',
    deps: ['@vueuse/core'],
  },
  'circular-text': {
    title: 'Circular Text',
    description:
      'Text around a spinning ring that reacts to hover, can be flung with inertia, tilts toward the cursor in 3D and holds an icon in the middle.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  shuffle: {
    title: 'Shuffle',
    description:
      'Letters slide past as a reel, flip in 3D or spin with motion blur through random glyphs before they land.',
    deps: ['@vueuse/core'],
  },
  'shiny-text': {
    title: 'Shiny Text',
    description:
      'A band of light that sweeps across text, from a soft sheen to chrome-like bands, on a loop, on hover, in view or following the pointer.',
    deps: ['@vueuse/core'],
  },
  'gradient-text': {
    title: 'Gradient Text',
    description:
      'Living gradients inside text: a sliding sweep, a drifting mesh or a swinging conic fan, with glow, border and colors that follow the cursor.',
    deps: ['@vueuse/core'],
  },
  'count-up': {
    title: 'Count Up',
    description:
      'Animated number counter that counts or rolls like an odometer, with formatting, decimals and compact units.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'split-text': {
    title: 'Split Text',
    description:
      'Splits text into letters, words or lines that rise, flip, pop, blur, skew or wave in, loop, replay on hover or click, and lift under the cursor.',
    deps: ['@vueuse/core'],
  },
  'blur-text': {
    title: 'Blur Text',
    description:
      'Text that blurs into focus by word or letter, with zoom, tilt, focus and drift effects, loop, hover or click replay and a start color.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'rotating-text': {
    title: 'Rotating Text',
    description:
      'Cycles through words letter by letter with slide, flip, blur, scale or drop swaps, optionally on a highlight block that resizes to fit.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'text-type': {
    title: 'Text Type',
    description:
      'Typewriter text with a gliding, softly blinking cursor, per-letter fade, blur or rise, corrected typos and an optional fixed prefix.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'fuzzy-text': {
    title: 'Fuzzy Text',
    description:
      'Canvas text that jitters in shifted strips, resolves out of static, splits into color fringes, and reacts to hover or clicks.',
    deps: ['@vueuse/core'],
  },
  'decrypted-text': {
    title: 'Decrypted Text',
    description:
      'Text that cycles random glyphs before resolving, with flip-board and fade effects, a decoding accent color, loops and cursor-local scrambling.',
    deps: ['@vueuse/core'],
  },
  'variable-proximity': {
    title: 'Variable Proximity',
    description:
      'Letters gain variable-font weight near the cursor and can shift color, grow and rise; an idle wave of weight runs while the cursor is away.',
    deps: ['@vueuse/core'],
  },
  'text-pressure': {
    title: 'Text Pressure',
    description:
      'Variable-font letters that swell near the cursor, with click ripples, idle wave or pulse motion and a pressure color.',
    deps: ['@vueuse/core'],
  },
  'scroll-reveal': {
    title: 'Scroll Reveal',
    description:
      'Text that reveals by word, letter or line on scroll, fading, rising, flipping or popping in, with an optional accent highlight.',
    deps: ['@vueuse/core'],
  },
  'scroll-float': {
    title: 'Scroll Float',
    description:
      'Scroll-linked heading whose letters float, flip, scatter, blur or wave into place, by letter or word, in any order and from an accent color.',
    deps: ['@vueuse/core'],
  },
  'text-cursor': {
    title: 'Text Cursor',
    description:
      'Text or emoji that trails the pointer as stamped copies, a following chain or a ribbon of letters, then pulls back when it stops.',
    deps: ['@vueuse/core'],
  },
  'scrambled-text': {
    title: 'Scrambled Text',
    description:
      'Text that decodes into view, then scrambles, rises, blurs or swells like a lens near the cursor; a click sends a scramble wave through it.',
    deps: [],
  },
  'curved-loop': {
    title: 'Curved Loop',
    description:
      'Looping marquee text along an arc, wave, ring or line, with drag-to-fling, outlined letters, accent separators and a scroll boost.',
    deps: ['@vueuse/core'],
  },
  'logo-loop': {
    title: 'Logo Loop',
    description:
      'Draggable looping strip of logos with a soft edge fade, intro, wave, arc and 3D orbit paths, center lens, dock magnify and labels.',
    deps: ['@nuxt/icon', '@vueuse/core'],
  },
  aurora: {
    title: 'Aurora',
    description:
      'A soft, calm aurora that flows across the top of the page and drifts toward the cursor.',
    deps: ['@vueuse/core'],
  },
  squares: {
    title: 'Squares',
    description:
      'Animated grid of squares with directional movement and hover interaction.',
    deps: ['@vueuse/core'],
  },
  'letter-glitch': {
    title: 'Letter Glitch',
    description:
      'A calm field of letters that flicker, scramble and glitch in color, stirred by the cursor and torn by clicks.',
    deps: ['@vueuse/core'],
  },
  iridescence: {
    title: 'Iridescence',
    description:
      'Liquid iridescent surface with shifting folds that you can stir with the cursor.',
    deps: ['@vueuse/core'],
  },
  'liquid-chrome': {
    title: 'Liquid Chrome',
    description:
      'Soft ribbons of liquid chrome that swirl through a dark pool, ripple under the cursor and catch the light as it moves.',
    deps: ['@vueuse/core'],
  },
  balatro: {
    title: 'Balatro',
    description:
      'The swirling Balatro paint shader with crisp pixels, a cursor that stirs the paint, click whirlpools and an optional CRT look.',
    deps: ['@vueuse/core'],
  },
  waves: {
    title: 'Waves',
    description:
      'Dense flowing lines that sway like silk, bend around the cursor and spring back, with click ripples, dashed lines and rotation.',
    deps: ['@vueuse/core'],
  },
  threads: {
    title: 'Threads',
    description:
      'Flowing threads that fray apart and part around the cursor, from fine silk to contour lines.',
    deps: ['@vueuse/core'],
  },
  orb: {
    title: 'Orb',
    description:
      'A glowing ring of swirling color that breathes, trails an orbiting light, reaches toward the cursor and pulses on click.',
    deps: ['@vueuse/core'],
  },
  silk: {
    title: 'Silk',
    description:
      'Flowing satin folds with glossy highlights that turn toward the cursor and ripple on click.',
    deps: ['@vueuse/core'],
  },
  'floating-lines': {
    title: 'Floating Lines',
    description:
      'Waves of fine glowing lines that drift, part around the cursor and curl into a swirl when you click.',
    deps: ['@vueuse/core'],
  },
  beams: {
    title: 'Beams',
    description:
      'Glossy ribbons that ripple and catch a glowing light, which follows your cursor along the beams.',
    deps: ['@vueuse/core'],
  },
  'dark-veil': {
    title: 'Dark Veil',
    description:
      'A silky veil of light that drifts in the dark and bends around the cursor, in any color, with a light-mode ink variant.',
    deps: ['@vueuse/core'],
  },
  'faulty-terminal': {
    title: 'Faulty Terminal',
    description:
      'A flickering CRT terminal of glowing glyphs, with phosphor trails under the cursor and glitches on click.',
    deps: ['@vueuse/core'],
  },
  'gradient-blinds': {
    title: 'Gradient Blinds',
    description:
      'Satin gradient blinds lit by a cursor spotlight that sway, turn toward the light and ripple on click.',
    deps: ['@vueuse/core'],
  },
  'color-bends': {
    title: 'Color Bends',
    description:
      'Bands of color that bend and fold into each other in a slow, flowing warp that leans toward the cursor.',
    deps: ['@vueuse/core', 'three'],
  },
  'light-pillar': {
    title: 'Light Pillar',
    description:
      'A swirling pillar of light that ignites on load, leans toward the cursor and surges on click.',
    deps: ['@vueuse/core'],
  },
  'light-rays': {
    title: 'Light Rays',
    description:
      'Volumetric light rays from any edge with source glow and haze. The cursor steers the beam and casts a shadow; clicks send a wave of light.',
    deps: ['@vueuse/core'],
  },
  'side-rays': {
    title: 'Side Rays',
    description:
      'Shafts of light that fan in from a corner or side, shimmer slowly and lean toward the cursor.',
    deps: ['@vueuse/core'],
  },
  lightfall: {
    title: 'Lightfall',
    description:
      'Streaks of light falling down a curved tunnel, bending around the cursor and stretching into warp trails on hold.',
    deps: ['@vueuse/core'],
  },
  'ripple-grid': {
    title: 'Ripple Grid',
    description:
      'A crisp grid that ripples like water, bending and lighting up as waves pass through it, with dot, cross and floor styles.',
    deps: ['@vueuse/core'],
  },
  'ripple-transition': {
    title: 'Ripple Transition',
    description:
      'WebGL image transitions with noisy refractive waves, chromatic edges, glow, and click-triggered ripple origins.',
    deps: ['motion-v'],
  },
  'signature-eraser': {
    title: 'Signature Eraser',
    description:
      'A signing canvas whose ink disintegrates into physics particles — Thanos Snap, Black Hole, Explosion, Wind Sweep, and Rewind effects.',
    deps: ['@vueuse/core'],
  },
  'pixel-wave': {
    title: 'Pixel Wave',
    description:
      'A looping pixel-art ocean swell rendered on a dark LED grid of colored patches, morphing through crest, trough, fade, and rebuild.',
    deps: ['@vueuse/core'],
  },
  'progress-stepper': {
    title: 'Progress Stepper',
    description:
      'A vertical process timeline with a single rail, spinning in-progress markers, drawn-in checks and nested sub-steps that unfold under the active step.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'stacked-list': {
    title: 'Stacked List',
    description:
      'A media list that rests as an overlapping deck and fans into a full column on hover, with the first row anchoring the stack.',
    deps: ['motion-v'],
  },
  'circle-input': {
    title: 'Circle Input',
    description:
      'A segmented character input rendered as a row of circular cells that auto-types words, collapses to a single circle, and spreads back out.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'color-picker': {
    title: 'Color Picker',
    description:
      'A color swatch that blooms into a radial rosette of hue and pastel petals with a vertical lightness arc.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'gooey-dropdown': {
    title: 'Gooey Dropdown',
    description:
      'A pill trigger whose menu items stretch out of it with a gooey metaball merge before snapping into discrete buttons.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'holo-cloth': {
    title: 'Holo Cloth',
    description:
      'A grabbable sheet of simulated cloth draped in an iridescent holo-foil material, floating in zero gravity.',
    deps: ['three'],
  },
  'pixel-snow': {
    title: 'Pixel Snow',
    description:
      'Pixel-art snowflakes drifting down in layers of depth, brushed aside by the cursor.',
    deps: ['@vueuse/core'],
  },
  'prismatic-burst': {
    title: 'Prismatic Burst',
    description:
      'A burst of prismatic light rays that leans toward the cursor and sends a wave of light outward on click.',
    deps: ['@vueuse/core'],
  },
  'liquid-ether': {
    title: 'Liquid Ether',
    description:
      'A glowing liquid that swirls under the cursor, colored by how fast it flows, with an intro sweep, click puffs and a light mode.',
    deps: ['@vueuse/core'],
  },
  'pixel-blast': {
    title: 'Pixel Blast',
    description:
      'Dithered pixel clouds that drift, shimmer and light up under the cursor, with ripples, six shapes and a perspective floor.',
    deps: ['@vueuse/core'],
  },
  'dot-grid': {
    title: 'Dot Grid',
    description:
      'A springy dot grid that the cursor flicks and drags through like jelly, with click shockwaves.',
    deps: ['@vueuse/core'],
  },
  'grid-distortion': {
    title: 'Grid Distortion',
    description:
      'Image background that breaks into a grid of blocks under the cursor and settles back into place.',
    deps: ['@vueuse/core'],
  },
  'grid-motion': {
    title: 'Grid Motion',
    description:
      'A tilted wall of drifting tiles that slides with the pointer and lights up where it rests.',
    deps: ['@vueuse/core'],
  },
  'animated-content': {
    title: 'Animated Content',
    description:
      'Reveals its content on scroll with slides, blur, rotation, 3D tilts, soft wipes, staggered children, scroll-linked progress and a mount trigger.',
    deps: ['@vueuse/core'],
  },
  'fade-content': {
    title: 'Fade Content',
    description:
      'Fades content in on scroll: plain, out of focus, from washed-out gray, or through grain, mist and pixel blocks, with stagger and scrub.',
    deps: ['@vueuse/core'],
  },
  'click-spark': {
    title: 'Click Spark',
    description:
      'Bursts of sparks on every click, as dashes, comets, dots or stars, that can spill around buttons and fire from code.',
    deps: ['@vueuse/core'],
  },
  'star-border': {
    title: 'Star Border',
    description:
      'A star that glides around the outline of a button, pill or card with a fading trail, hover laps and a click pulse.',
    deps: ['@vueuse/core'],
  },
  magnet: {
    title: 'Magnet',
    description:
      'Elements lean toward the cursor on a spring, with tilt, scale, axis locking and a movement cap; only the nearest magnet reacts.',
    deps: ['@vueuse/core'],
  },
  'gradual-blur': {
    title: 'Gradual Blur',
    description:
      'Progressive edge blur for headers, footers and carousels, with a fade to color, hover to clear, and auto-hide at the ends of a scroll.',
    deps: ['@vueuse/core'],
  },
  'glare-hover': {
    title: 'Glare Hover',
    description:
      'A glossy light streak that sweeps across any element in the direction the cursor moves, with a glinting rim edge.',
    deps: ['@vueuse/core'],
  },
  'pixel-transition': {
    title: 'Pixel Transition',
    description:
      'Retro pixel dissolve that covers a card in pixels, swaps to the second slot and clears again, with ripple, wipe and dither patterns.',
    deps: ['@vueuse/core'],
  },
  'electric-border': {
    title: 'Electric Border',
    description:
      'Wraps any element in crackling strands of current that surge near the cursor, jolt on click and leap off in sparks.',
    deps: ['@vueuse/core'],
  },
  'meta-balls': {
    title: 'Meta Balls',
    description:
      'Liquid metaballs that merge, stretch and pinch apart, with a cursor blob that pushes through them and splashes on click.',
    deps: ['@vueuse/core'],
  },
  'blob-cursor': {
    title: 'Blob Cursor',
    description:
      'A 3D liquid blob cursor that stretches into a tail, drips and bursts into droplets on click, in chrome, jelly, pearl or ink.',
    deps: ['@vueuse/core', 'three'],
  },
  'shape-blur': {
    title: 'Shape Blur',
    description:
      'A crisp logo or shape that drifts out of focus under the pointer like a camera lens.',
    deps: ['@vueuse/core'],
  },
  stack: {
    title: 'Stack',
    description:
      'Pile of cards you can drag, flick or click through, with thrown cards tucking underneath.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'tilted-card': {
    title: 'Tilted Card',
    description:
      'A 3D card that tilts toward the cursor, with glare, a soft shadow, floating depth layers and a flip side.',
    deps: ['@vueuse/core'],
  },
  'timezone-companion': {
    title: 'Timezone Companion',
    description:
      'Two timezone tools: a meeting-overlap hour grid with a draggable scrubber, and a dark world clock scrubbed by a tick ruler.',
    deps: ['@vueuse/core'],
  },
  'weather-forecast': {
    title: 'Weather Forecast',
    description:
      'A weather card with a colored condition orb glowing behind frosted glass, unit toggle, and hover-driven day chips.',
    deps: ['motion-v'],
  },
  'decay-card': {
    title: 'Decay Card',
    description:
      'An image card drawn with WebGL that tears and melts as the pointer moves, then pulls itself back together.',
    deps: ['@vueuse/core'],
  },
  'dithered-logo': {
    title: 'Dithered Logo',
    description:
      'Renders any logo as a Floyd-Steinberg dithered particle field with cursor repulsion and click ripples.',
    deps: ['@vueuse/core'],
  },
  dock: {
    title: 'Dock',
    description:
      'macOS style dock with spring magnification, launch hop, badges, auto hide, right-click menus with submenus, on any edge.',
    deps: ['@vueuse/core'],
  },
  'visual-stepper': {
    title: 'Visual Stepper',
    description:
      'Auto-playing vertical stepper with growing connector bars and a crossfading preview card.',
    deps: ['motion-v'],
  },
  'liquid-glass-carousel': {
    title: 'Liquid Glass Carousel',
    description:
      'An infinite scroll-driven portfolio carousel drawn through a liquid-glass lens, with focus mode and an entry animation.',
    deps: ['three', 'motion-v', '@vueuse/core'],
  },
  'banknote-bento': {
    title: 'Banknote Bento',
    description:
      'Engraving-style bento cards with duotone tints, serif captions, and an ironbow thermal card whose procedural heat field rises and falls over the artwork.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'typer-text': {
    title: 'Typer Text',
    description:
      'Typing transition where words get staggered outline boxes while a solid accent cursor block sweeps across, scrambling characters before they settle.',
    deps: [],
  },
  'podcast-player': {
    title: 'Podcast Player',
    description:
      'Expandable podcast episode card driving a real audio element — waveform seek with hover scrubber, chapters, speed cycling, volume, and a compact pill mode.',
    deps: ['motion-v'],
  },
  nostalgia: {
    title: 'Nostalgia',
    description:
      'Vintage slide-viewer that cycles through memories while a fan of polaroid thumbnails arcs around it and a year + serif title crossfade underneath.',
    deps: ['motion-v'],
  },
  'animated-toc': {
    title: 'Animated TOC',
    description:
      'Table of contents with an SVG rail that snakes through nesting levels and a dot that glides along the curve to the active entry.',
    deps: ['@vueuse/core'],
  },
  'aurora-accordion': {
    title: 'Aurora Accordion',
    description:
      'Accordion whose opened row detaches into its own card while an aurora gradient blooms behind the answer.',
    deps: ['motion-v'],
  },
  'bouncy-accordion': {
    title: 'Bouncy Accordion',
    description:
      'Accordion with a playful spring bounce — the open row detaches from its neighbors with animated corner radii and a gap that springs apart.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'curved-input': {
    title: 'Curved Input',
    description:
      'An input bar bent along an arc, with text, caret and submit button that all follow the curve.',
    deps: ['@vueuse/core'],
  },
  'line-sidebar': {
    title: 'Line Sidebar',
    description:
      'List navigation with a marker rail; items near the cursor shift, tint and grow their markers, and the clicked item stays lit.',
    deps: ['@vueuse/core'],
  },
  'prism-gradient': {
    title: 'Prism Gradient',
    description:
      'WebGL2 hero gradient — three colors swirled through sixteen iterations of sinusoidal distortion, tracking light and dark mode automatically.',
    deps: [],
  },
  'silk-aurora': {
    title: 'Silk Aurora',
    description:
      'Premium WebGL hero with satin-dark aurora ribbons, pearlescent highlights, fine film grain, and cursor depth.',
    deps: [],
  },
  'curved-drawer': {
    title: 'Curved Drawer',
    description:
      'Slide-in drawer whose inner edge bulges with velocity via SVG path morphing, settling straight at rest.',
    deps: ['@vueuse/core'],
  },
  'dynamic-island-header': {
    title: 'Dynamic Island Header',
    description:
      'Navbar that collapses into a compact pill on scroll, morphing to show the active section and reading progress.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'drag-reorder-list': {
    title: 'Drag Reorder List',
    description:
      'Drag-to-reorder list with lift, tilt, shadow, and an empty-space cutout drop indicator.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'elastic-slider': {
    title: 'Elastic Slider',
    description:
      'A slider that grows under the cursor and stretches like rubber when pulled past either end, then springs back.',
    deps: ['@vueuse/core'],
  },
  'bounce-cards': {
    title: 'Bounce Cards',
    description:
      'A fan of photo cards that bounce in, then spread apart and straighten the one you hover.',
    deps: ['@vueuse/core'],
  },
  'pixel-card': {
    title: 'Pixel Card',
    description:
      'A card whose canvas pixels reveal in a glowing wave from the center or cursor, on hover, click or always on, with a cursor spotlight.',
    deps: ['@vueuse/core'],
  },
  'notification-center': {
    title: 'Notification Center',
    description:
      'Frosted notification panel with badged bell trigger, spring-animated rows that expand in place, and live relative timestamps.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'frosted-navigation': {
    title: 'Frosted Navigation',
    description:
      'Bottom navigation where content melts into a progressive frosted-glass gradient, with a serif search pill and spring-animated tabs.',
    deps: ['motion-v'],
  },
  'playstation-navbar': {
    title: 'PlayStation Navbar',
    description:
      'XMB-style cross-media navigation with a sliding category rail, glowing pill cursor, and full arrow-key control.',
    deps: ['motion-v'],
  },
  stepper: {
    title: 'Stepper',
    description:
      'A multi-step flow in a frosted panel with a gliding step indicator, spring transitions and number, dot, bar or vertical layouts.',
    deps: ['@vueuse/core'],
  },
  carousel: {
    title: 'Carousel',
    description:
      'Swipeable spring-physics cards with five transitions, dots, timer bars or a counter, autoplay, loop and photo cards.',
    deps: ['@vueuse/core'],
  },
  'flowing-menu': {
    title: 'Flowing Menu',
    description:
      'A full-height menu with one liquid band that glides and stretches between rows and reveals a scrolling marquee of each item.',
    deps: ['@vueuse/core'],
  },
  'flying-posters': {
    title: 'Flying Posters',
    description:
      '3D posters that twist and flip as you scroll or drag through an endless column.',
    deps: ['@vueuse/core'],
  },
  'circular-gallery': {
    title: 'Circular Gallery',
    description:
      'A curved WebGL image gallery you can drag, scroll or tab through, with cards that open to the full image.',
    deps: ['@vueuse/core'],
  },
  counter: {
    title: 'Counter',
    description:
      'An odometer-style number whose digits roll on springs to each new value, with motion blur, an intro spin and Intl formatting.',
    deps: ['@vueuse/core'],
  },
  'animated-list': {
    title: 'Animated List',
    description:
      'Scrolling list whose rows spring in from the edge they scroll in from, with a gliding selection ring and arrow-key navigation.',
    deps: ['@vueuse/core'],
  },
  folder: {
    title: 'Folder',
    description:
      '3D folder that drops its flap open or swings open like a book, in solid, glass or matte, with pages you can zoom, drag out and drop back in.',
    deps: ['@vueuse/core'],
  },
  'glass-icons': {
    title: 'Glass Icons',
    description:
      'Liquid glass icons that bend the color behind them, for app grids, docks and social links.',
    deps: [],
  },
  'gooey-nav': {
    title: 'Gooey Nav',
    description:
      'A navigation bar whose active pill breaks into goo that flows over to the item you pick.',
    deps: ['@vueuse/core'],
  },
  'bubble-menu': {
    title: 'Bubble Menu',
    description:
      'A logo bubble and round menu button that pop open large tilted pill links with a staggered scale-in.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'card-swap': {
    title: 'Card Swap',
    description:
      'A 3D stack of cards that sends the front card to the back on a timer, or when you drag and fling it.',
    deps: ['@vueuse/core'],
  },
  'chroma-grid': {
    title: 'Chroma Grid',
    description:
      'A grid of grayscale photo cards where a spotlight follows the cursor and brings back color.',
    deps: ['@vueuse/core'],
  },
  'magic-bento': {
    title: 'Magic Bento',
    description:
      'A bento grid of feature cards with live artwork, edge light that follows the cursor and a click wave across the grid.',
    deps: ['@vueuse/core'],
  },
  masonry: {
    title: 'Masonry',
    description:
      'A masonry gallery that springs tiles into place, reflows on resize, reorders by drag and opens images in a lightbox.',
    deps: ['@vueuse/core'],
  },
  'card-nav': {
    title: 'Card Nav',
    description:
      'A navigation bar that springs open into a row of cards, each with its own links.',
    deps: ['@vueuse/core'],
  },
  'glass-surface': {
    title: 'Glass Surface',
    description:
      'Liquid glass that bends what is behind it, in a rounded panel or any logo shape, with SVG or WebGL refraction.',
    deps: ['@vueuse/core'],
  },
  'profile-card': {
    title: 'Profile Card',
    description:
      'A framed profile card that tilts toward the cursor, with holographic foil shining through a tiled pattern.',
    deps: ['@vueuse/core'],
  },
  'receipt-printer': {
    title: 'Receipt Printer',
    description:
      'A checkout state that turns payment processing into a printed order receipt, with a stepped paper feed, a status screen and a serrated paper tear.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'reflective-card': {
    title: 'Reflective Card',
    description:
      'A WebGL2 metal ID card that reflects a looping video or your camera, tilts toward the cursor and catches a moving light.',
    deps: ['@vueuse/core'],
  },
  'scrub-input': {
    title: 'Scrub Input',
    description:
      'An inline slider input styled as a pill, perfect for adjusting variables smoothly.',
    deps: [],
  },
  'letter-cascade': {
    title: 'Letter Cascade',
    description:
      'A 3D split-flap letter animation with spring physics that cascades on hover or click.',
    deps: ['@vueuse/core'],
  },
  'text-repel': {
    title: 'Text Repel',
    description:
      'Physics-based text where letters are repelled or attracted by the cursor with spring dynamics.',
    deps: ['@vueuse/core'],
  },
  'cursor-driven-particle-typography': {
    title: 'Particle Typography',
    description:
      'Canvas-based text rendered as particles that disperse on cursor hover with spring physics.',
    deps: ['@vueuse/core'],
  },
  'scroll-choreography': {
    title: 'Scroll Choreography',
    description:
      'Scroll-driven image choreography with diagonal movement, stacking, and hero expansion phases.',
    deps: ['@vueuse/core'],
  },
  'layered-stack': {
    title: 'Layered Stack',
    description:
      'A container that stacks its children into a pile with random rotation, fanning out on hover.',
    deps: ['@vueuse/core'],
  },
  prism: {
    title: 'Prism',
    description:
      'Rotating prism of glowing spectral light that tilts toward the cursor, with custom colors, shape, motion and a light mode.',
    deps: ['@vueuse/core'],
  },
  'shape-grid': {
    title: 'Shape Grid',
    description:
      'A drifting grid of shapes that lights up under the cursor, with perspective tilt, rainbow trails and click ripples.',
    deps: ['@vueuse/core'],
  },
  'magic-rings': {
    title: 'Magic Rings',
    description:
      'Glowing rings that pulse, ripple or breathe, swell toward the cursor, flare on click, and can tilt, spin or split into prism fringes.',
    deps: ['@vueuse/core'],
  },
  'evil-eye': {
    title: 'Evil Eye',
    description:
      'Procedural evil eye shader with an animated iris, a slit pupil that follows the cursor, and a fiery outer glow.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'soft-aurora': {
    title: 'Soft Aurora',
    description:
      'Soft aurora band built from 3D Perlin noise that reaches toward the cursor and carries click pulses.',
    deps: ['@vueuse/core'],
  },
  'line-waves': {
    title: 'Line Waves',
    description:
      'Fine lines that flow in silky waves while a band of light drifts through them, with a cursor spotlight and click ripples.',
    deps: ['@vueuse/core'],
  },
  'border-glow': {
    title: 'Border Glow',
    description:
      'Card with a mesh-gradient border and outer glow that follow the cursor direction and grow stronger near the edges.',
    deps: ['@vueuse/core'],
  },
  noise: {
    title: 'Noise',
    description:
      'Film grain overlay for photos and pages, from fine 35mm grain to dust, scratches, paper and TV static.',
    deps: ['@vueuse/core'],
  },
  'text-string': {
    title: 'Text String',
    description:
      'A Verlet physics rope simulation where each character is a draggable node connected by distance constraints with gravity, collision, and progressive unravel.',
    deps: ['@vueuse/core'],
  },
  'split-flap-display': {
    title: 'Split Flap Display',
    description:
      'An airport-style split flap display that cycles through characters with realistic flip animations and staggered timing.',
    deps: [],
  },
  'eye-tracking': {
    title: 'Eye Tracking',
    description:
      'Realistic eyes that follow the cursor with spring physics, blinking, reactive pupil dilation, and four style variants.',
    deps: ['@vueuse/core'],
  },
  'mac-keyboard': {
    title: 'Mac Keyboard',
    description:
      'An interactive Mac keyboard that highlights pressed keys in real-time with Web Audio key click sounds.',
    deps: ['@vueuse/core'],
  },
  'image-ripple-effect': {
    title: 'Image Ripple Effect',
    description:
      'A WebGL image viewer with interactive ripple distortion using FBO ping-pong and custom shaders.',
    deps: ['three', '@vueuse/core'],
  },
  'infinite-image-field': {
    title: 'Infinite Image Field',
    description:
      'An infinite scrolling grid of images on canvas driven by cursor position with smooth camera movement.',
    deps: ['@vueuse/core'],
  },
  plasma: {
    title: 'Plasma',
    description:
      'Soft folds of satin light twisting slowly through the dark, turning in 3D to follow the cursor.',
    deps: ['@vueuse/core'],
  },
  'paper-shader-mount': {
    title: 'Paper Shader Mount',
    description:
      'Vue mount for Paper Shaders — wraps the framework-agnostic ShaderMount class with Vue lifecycle, reactive uniforms, and URL-to-image loading.',
    deps: ['@paper-design/shaders'],
  },
  'paper-mesh-gradient': {
    title: 'Mesh Gradient',
    description:
      'A flowing composition of color spots moving along distinct trajectories with organic distortion. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-smoke-ring': {
    title: 'Smoke Ring',
    description:
      'Radial multi-colored gradient shaped with layered noise for a natural, smoky aesthetic. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-neuro-noise': {
    title: 'Neuro Noise',
    description:
      'A glowing, web-like structure of fluid lines and soft intersections. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-dot-orbit': {
    title: 'Dot Orbit',
    description:
      'Animated multi-color dots pattern with each dot orbiting around its cell center. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-dot-grid': {
    title: 'Dot Grid',
    description:
      'Static grid pattern made of circles, diamonds, squares or triangles. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-simplex-noise': {
    title: 'Simplex Noise',
    description:
      'A multi-color gradient mapped into smooth, animated simplex-noise curves. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-metaballs': {
    title: 'Metaballs',
    description:
      'Up to 20 gooey blobs moving around the center and merging into smooth organic shapes. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-perlin-noise': {
    title: 'Perlin Noise',
    description:
      'Animated 3D Perlin noise with exposed octave, persistence, and contour controls. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-voronoi': {
    title: 'Voronoi',
    description:
      'Anti-aliased animated Voronoi pattern with smooth, customizable cell edges and glow. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-waves': {
    title: 'Waves',
    description:
      'Static line pattern configurable into textures from sharp zigzags to smooth flowing waves. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-warp': {
    title: 'Warp',
    description:
      'Animated color fields warped by noise and swirls over checks, stripes, or edge patterns. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-god-rays': {
    title: 'God Rays',
    description:
      'Animated rays of light radiating from a configurable origin, blended with up to 5 colors. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-spiral': {
    title: 'Spiral',
    description:
      'A single-colored animated spiral morphing from crisp geometry to flowing whirlpool forms. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-swirl': {
    title: 'Swirl',
    description:
      'Animated bands of color twisting into spirals, arcs, and flowing circular patterns. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-dithering': {
    title: 'Dithering',
    description:
      'Animated 2-color dithering over noise, warp, dots, waves, ripple, swirl, and sphere sources. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-grain-gradient': {
    title: 'Grain Gradient',
    description:
      'Multi-color gradients with grainy, noise-textured distortion in 7 animated abstract forms. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-pulsing-border': {
    title: 'Pulsing Border',
    description:
      'Luminous trails of color merging into a glowing gradient frame around the canvas edge. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-color-panels': {
    title: 'Color Panels',
    description:
      'Glowing translucent 3D panels rotating around a central axis with adjustable perspective. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-static-mesh-gradient': {
    title: 'Static Mesh Gradient',
    description:
      'Multi-point mesh gradient with up to 10 color spots, two-direction warping, and grain controls. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-static-radial-gradient': {
    title: 'Static Radial Gradient',
    description:
      'Radial gradient with up to 10 blended colors, focal point control, shape distortion, and grain. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-texture': {
    title: 'Paper Texture',
    description:
      'A static paper texture built from grain, fiber, wrinkles, crumples, folds and drops. Works as an image filter or as a standalone texture. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-water': {
    title: 'Water',
    description:
      'Water-like surface distortion with caustic realism — an image filter or standalone animated texture. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-fluted-glass': {
    title: 'Fluted Glass',
    description:
      'Image filter transforming a picture into streaked, ribbed glass distortions mixing clarity and obscurity. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-image-dithering': {
    title: 'Image Dithering',
    description:
      'A dithering image filter with 4 pattern modes and multiple color palettes. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-heatmap': {
    title: 'Heatmap',
    description:
      'A glowing gradient of colors flowing through an input image as an animated intensity wave. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-liquid-metal': {
    title: 'Liquid Metal',
    description:
      'Futuristic liquid metal material applied to an uploaded logo or predefined abstract shapes. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-halftone-dots': {
    title: 'Halftone Dots',
    description:
      'A halftone-dot image filter featuring customizable grids, color palettes, and dot styles. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-halftone-cmyk': {
    title: 'Halftone CMYK',
    description:
      'A classic CMYK halftone image filter with per-channel angle and grid control. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'paper-gem-smoke': {
    title: 'Gem Smoke',
    description:
      'Animated color fields running around a glassy logo or abstract shape. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },

  'editorial-orbs': {
    title: 'Editorial Orbs',
    description:
      'Bouncing glowing orbs with text that dynamically flows around them in multi-column layout.',
    deps: ['@vueuse/core'],
  },
  'plasma-wave': {
    title: 'Plasma Wave',
    description:
      'Two ribbons of plasma curling through each other, with soft glow and white-hot cores.',
    deps: ['@vueuse/core'],
  },
  'dot-field': {
    title: 'Dot Field',
    description:
      'A gradient dot field seen through a lens that follows the cursor, magnifying, pinching or swirling the dots.',
    deps: ['@vueuse/core'],
  },
  'sticky-scroll-cards': {
    title: 'Sticky Scroll Cards',
    description:
      'Scroll-driven card stack where images pin and scale with subtle rotation, creating a layered depth effect.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'music-player': {
    title: 'Music Player',
    description:
      'Interactive vinyl-record music player with swinging tonearm and animated rotation. Supports audio URLs and YouTube embeds.',
    deps: ['motion-v'],
  },
  'scroll-split-card': {
    title: 'Scroll Split Card',
    description:
      'Scroll-driven interactive card that splits into three panels and flips to reveal back-side content with 3D transforms.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  antigravity: {
    title: 'Antigravity',
    description:
      'A field of particles that lifts into a glowing ring around the cursor and bursts outward on click.',
    deps: ['@vueuse/core'],
  },
  'ascii-text': {
    title: 'ASCII Text',
    description:
      'Waving ASCII text that tilts toward the pointer, scrambles on hover and ripples on click.',
    deps: ['@vueuse/core'],
  },
  'dome-gallery': {
    title: 'Dome Gallery',
    description:
      'Immersive 3D dome gallery projecting images on a hemispheric surface; drag to spin with inertia, click a tile to open it.',
    deps: ['@vueuse/core'],
  },
  'falling-text': {
    title: 'Falling Text',
    description:
      'Text that breaks apart and tumbles into a pile you can drag, throw and swipe, then flies back into place.',
    deps: ['@vueuse/core', 'matter-js'],
  },
  'fluid-glass': {
    title: 'Fluid Glass',
    description:
      'A glass object that refracts your headline, image or video, follows the cursor and melts between seven shapes.',
    deps: ['@vueuse/core'],
  },
  galaxy: {
    title: 'Galaxy',
    description:
      'Endless flight through a twinkling starfield with warp jumps, cursor repulsion and star palettes.',
    deps: ['@vueuse/core'],
  },
  'ghost-cursor': {
    title: 'Ghost Cursor',
    description:
      'A ghost of glowing smoke that follows the cursor on a spring, curls as it rises and puffs on click, on raw WebGL2.',
    deps: ['@vueuse/core'],
  },
  'grid-scan': {
    title: 'Grid Scan',
    description:
      'A lit 3D grid room swept by a scanning light. The view shifts with the cursor and clicks send a ping across the walls.',
    deps: ['@vueuse/core'],
  },
  'image-trail': {
    title: 'Image Trail',
    description:
      'A trail of photos behind the cursor with tunable size, timing, zoom, flash, drift, 3D tilt, rotation and a stacking pile.',
    deps: ['@vueuse/core'],
  },
  'infinite-menu': {
    title: 'Infinite Menu',
    description:
      'A draggable WebGL sphere of image tiles that snaps the nearest tile forward and shows its title, description and link.',
    deps: ['@vueuse/core'],
  },
  lanyard: {
    title: 'Lanyard',
    description:
      'Swinging 3D badge on a stretchy woven band that you can drag, throw or click to flip.',
    deps: ['@vueuse/core', 'three'],
  },
  'laser-flow': {
    title: 'Laser Flow',
    description:
      'A beam of light that drops onto your content, runs along its top edge and pours over its corners, with a cursor reveal.',
    deps: ['@vueuse/core'],
  },
  'metallic-paint': {
    title: 'Metallic Paint',
    description:
      'Liquid chrome that flows over a logo or text, bends around its edges, tilts with the cursor and pours in on load.',
    deps: ['@vueuse/core'],
  },
  'model-viewer': {
    title: 'Model Viewer',
    description:
      'A 3D model viewer for glb, gltf, fbx and obj files that frames the model, lights it with an HDRI and floats it over a soft shadow.',
    deps: ['@vueuse/core', 'three'],
  },
  'orbit-card-stack': {
    title: 'Orbit Card Stack',
    description:
      'A stacked deck of profile cards that fans out into an orbital arc on hover, lifting the active card with spring physics.',
    deps: ['motion-v', '@vueuse/core'],
  },
  'orbit-images': {
    title: 'Orbit Images',
    description:
      'Photos travel along an SVG path with depth, passing behind and in front of center content. Drag to spin, click to bring one forward.',
    deps: ['@vueuse/core'],
  },
  particles: {
    title: 'Particles',
    description:
      'A drifting 3D field of particles with glow, twinkle, constellation lines, drift modes and cursor repel, attract or parallax.',
    deps: ['@vueuse/core'],
  },
  'pill-nav': {
    title: 'Pill Nav',
    description:
      'A pill nav bar where a fill rises through each link as its label rolls over, with a sliding active dot and a menu that folds in on small screens.',
    deps: ['@vueuse/core'],
  },
  'pixel-trail': {
    title: 'Pixel Trail',
    description:
      'Glossy WebGL2 pixels melt into a fluid goo trail behind the cursor, with color shifts, drips, sparkle, click bursts, dither and image reveals.',
    deps: ['@vueuse/core'],
  },
  'scroll-stack': {
    title: 'Scroll Stack',
    description:
      'Cards pin and stack as you scroll, settling back into a dimmed deck with smooth, jitter-free motion.',
    deps: ['@vueuse/core'],
  },
  'splash-cursor': {
    title: 'Splash Cursor',
    description:
      'A WebGL2 fluid simulation that trails the cursor in swirling ink and bursts into a splash on click.',
    deps: ['@vueuse/core'],
  },
  'staggered-menu': {
    title: 'Staggered Menu',
    description:
      'Side menu whose color layers slide in one after another, then links rise in with a staggered tilt as the toggle rolls from Menu to Close.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'holo-sticker': {
    title: 'Holo Sticker',
    description:
      'A die-cut holographic sticker rendered in WebGL: rainbow foil sweeps with your cursor, embossed ink relief, page-curled peel, and exploded production layers.',
    deps: ['three', '@vueuse/core'],
  },
  'target-cursor': {
    title: 'Target Cursor',
    description:
      'A spinning reticle cursor whose corner brackets snap around targets, follow their corner radius and show a label.',
    deps: ['@vueuse/core'],
  },
  chart: {
    title: 'Chart',
    description:
      'Dependency-free SVG chart engine with the TanStack Charts API. Swap to @tanstack/vue-charts by editing one file.',
    deps: ['@vueuse/core'],
  },
  sparkline: {
    title: 'Sparkline',
    description:
      'A compact trend line with a shaded area that rises into place, sized for KPI cards and table cells.',
    deps: ['@vueuse/core'],
  },
  'area-chart': {
    title: 'Area Chart',
    description:
      'A responsive area chart with axes and grid lines whose values rise from the baseline on mount.',
    deps: ['@vueuse/core'],
  },
  'donut-chart': {
    title: 'Donut Chart',
    description:
      'A donut chart that sweeps in clockwise, with a counting total in the center and a legend that lifts its slice on hover.',
    deps: ['@vueuse/core'],
  },
  'radial-gauge': {
    title: 'Radial Gauge',
    description:
      'A 270° gauge with a rounded value arc, threshold colors, and a readout that counts up to the value.',
    deps: ['@vueuse/core'],
  },
  'progress-ring': {
    title: 'Progress Ring',
    description:
      'A circular progress indicator with rounded ends and a percentage that counts up with the ring.',
    deps: ['@vueuse/core'],
  },
  'kpi-card': {
    title: 'KPI Card',
    description:
      'A metric card with a tinted icon, an actions button, a counting value and a stack of avatars or initials.',
    deps: ['@vueuse/core'],
  },
  'kpi-carousel': {
    title: 'KPI Carousel',
    description:
      'A titled panel of best, worst and neutral metric cards with tone tints, arrows, dots and peeking neighbours.',
    deps: ['@vueuse/core'],
  },
  'block-palette': {
    title: 'Block Palette',
    description:
      'An "Add Block" palette with search, colored block types and live previews, and pointer or keyboard drag-to-reorder that lifts the row as a tilted card.',
    deps: ['@vueuse/core'],
  },
  'canvas-toolbar': {
    title: 'Canvas Toolbar',
    description:
      'A canvas tool switcher with a sliding active pill and number-key shortcuts, plus a floating selection toolbar with view and action menus.',
    deps: ['@vueuse/core'],
  },
  'node-canvas': {
    title: 'Node Canvas',
    description:
      'A pannable, zoomable node canvas with draggable nodes, live bezier edges, selection handles, a minimap and a zoom control.',
    deps: ['@vueuse/core'],
  },
  'downtime-log': {
    title: 'Downtime Log',
    description:
      'A machine downtime log with selectable stops, reason pills, a reason filter, sort modes and a 24-hour stop timeline linked to the rows.',
    deps: ['@vueuse/core'],
  },
  'range-calendar': {
    title: 'Range Calendar',
    description:
      'A month heatmap calendar for picking a date range, with presets, a live range pill, a shaded legend and a compare switch.',
    deps: [],
  },
  'beeswarm-chart': {
    title: 'Beeswarm Chart',
    description:
      'A cycle-time beeswarm dot plot with a machine switch, median and takt lines, a hatched over-takt zone, an axis break and an on-takt footer.',
    deps: ['@vueuse/core'],
  },
  'iso-stacked-bars': {
    title: 'Iso Stacked Bars',
    description:
      'An isometric 3D stacked bar chart: two rows of shaded, textured boxes on a floor plate, with tooltips, legend highlighting and a staggered grow-in.',
    deps: ['@vueuse/core'],
  },
  'pattern-donut': {
    title: 'Pattern Donut',
    description:
      'A two-ring donut: solid category slices inside, patterned cause segments outside, a hover-driven center label, a pinnable legend and a computed insight.',
    deps: [],
  },
  'accordion-gallery': {
    title: 'Accordion Gallery',
    description:
      'Image panels that expand on hover, click or focus, with 3D tilt, parallax images and a staggered caption.',
    deps: ['@vueuse/core'],
  },
  'bell-toggle': {
    title: 'Bell Toggle',
    description:
      'Pill toggle where a press rings the bell, crossfades the label and unfurls the pill.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'branched-menu': {
    title: 'Branched Menu',
    description:
      'Collapsible menu that branches each section from a trunk and traces a line to your pick.',
    deps: ['@vueuse/core'],
  },
  'call-chip': {
    title: 'Call Chip',
    description:
      'Tool-call chip whose fill wipes across as a live timer ticks, ending green or shaking red.',
    deps: ['@vueuse/core'],
  },
  'circular-carousel': {
    title: 'Circular Carousel',
    description:
      'A 3D ring of images with bendable cards, momentum drag, snapping and click to focus.',
    deps: ['@vueuse/core'],
  },
  'code-slots': {
    title: 'Code Slots',
    description:
      'One-time code input whose digits spring into their slots, with paste and SMS autofill, error drain and success wash.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'comet-dial': {
    title: 'Comet Dial',
    description:
      'Circular dial you set by angle, with a comet trail that streaks behind the head when it moves fast and flick momentum.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'crystalized-ball': {
    title: 'Crystalized Ball',
    description:
      'A WebGL glass ball with a crackling electric rim and glowing dust that swirls with the cursor.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'depth-carousel': {
    title: 'Depth Carousel',
    description:
      'Image carousel whose cards recede along a tilted 3D rail, with drag, wheel, keyboard, dot and auto-advance navigation.',
    deps: ['@vueuse/core'],
  },
  'depth-text': {
    title: 'Depth Text',
    description:
      'Display type extruded from stacked layers in 3D that tilts toward the pointer, orbits when idle, and presses in on hover.',
    deps: ['@vueuse/core'],
  },
  'dodge-field': {
    title: 'Dodge Field',
    description:
      'Wrapper that makes any child dodge the pointer until it relents and glides home.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'drift-wall': {
    title: 'Drift Wall',
    description:
      'An endless 3D wall of image tiles drifting in alternating columns, lifting a tile toward you on hover or focus.',
    deps: ['@vueuse/core'],
  },
  'echo-text': {
    title: 'Echo Text',
    description:
      'Tinted, blurred copies trail behind the text and settle into one word, following the cursor, drifting, or scrolling, with click bursts.',
    deps: ['@vueuse/core'],
  },
  'elastic-mesh': {
    title: 'Elastic Mesh',
    description:
      'Turns text or a logo into a puffy inflated WebGL2 shape you can press, poke and stretch like jelly.',
    deps: ['@vueuse/core'],
  },
  'flex-carousel': {
    title: 'Flex Carousel',
    description:
      'An infinite WebGL image row that bends, twists and splits into rainbow light where it crosses an invisible glass lens.',
    deps: ['ogl'],
  },
  'flip-card': {
    title: 'Flip Card',
    description:
      'Two-faced card that flips in 3D on a click, drag or flick and settles on a spring.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'flying-button': {
    title: 'Flying Button',
    description:
      'A button that fires thrusters on hover, lifts off on a WebGL2 smoke plume, can be dragged in flight and lands in its own cloud.',
    deps: ['@vueuse/core'],
  },
  'fold-text': {
    title: 'Fold Text',
    description:
      'Text that unfolds piece by piece from a hinge edge like creased paper, with blinds and flip styles and a pointer refold.',
    deps: ['@vueuse/core'],
  },
  'folder-float': {
    title: 'Folder Float',
    description:
      'Folder whose notes spring out into a floating cloud on hover or press; once landed they drift and can be dragged and thrown.',
    deps: ['@vueuse/core', 'matter-js'],
  },
  'fuse-button': {
    title: 'Fuse Button',
    description:
      'Action button that turns into an Undo while a fuse burns around the pill; hover pauses it and Escape cancels.',
    deps: ['@vueuse/core'],
  },
  'glide-select': {
    title: 'Glide Select',
    description:
      'Select chip whose menu pops from its corner and whose highlight glides between rows.',
    deps: ['@vueuse/core'],
  },
  'hold-button': {
    title: 'Hold Button',
    description:
      'Hold-to-confirm button whose liquid fill with a wave crest sweeps across while pressed and snaps back if you let go.',
    deps: ['@vueuse/core'],
  },
  'holo-card': {
    title: 'Holo Card',
    description:
      'Trading card with a WebGL holographic foil, glittering border and pointer tilt. Optional back face flips on click.',
    deps: ['@vueuse/core'],
  },
  'infinite-spiral': {
    title: 'Infinite Spiral',
    description:
      'An endlessly looping 3D helix of image cards that plays by itself, follows a drag or follows page scroll.',
    deps: ['@vueuse/core'],
  },
  'jelly-radio': {
    title: 'Jelly Radio',
    description:
      'Radio group of chips where the chosen one swells and barges its neighbours outward.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'lattice-loader': {
    title: 'Lattice Loader',
    description:
      'Agent status row with a lattice of cells that brighten in a wave beside a live stopwatch.',
    deps: [],
  },
  'masked-heading': {
    title: 'Masked Heading',
    description:
      'A heading whose letters show an image or looping video, with rise, scale, blur, wipe or fade entrances, pointer parallax and a spotlight.',
    deps: ['@vueuse/core'],
  },
  'morph-slider': {
    title: 'Morph Slider',
    description:
      'WebGL image slider that melts, ripples, shears or swirls between slides, with drag scrubbing, autoplay, captions and dots.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'option-wheel': {
    title: 'Option Wheel',
    description:
      'Curved option picker that spins with scroll, drag or arrow keys, tilting items away.',
    deps: ['@vueuse/core'],
  },
  'paper-crumple': {
    title: 'Paper Crumple',
    description:
      'An image on a 3D paper sheet that crumples into a ball while you hold it, follows the pointer as you drag, and unfolds on release.',
    deps: ['@vueuse/core', 'three'],
  },
  'particle-text': {
    title: 'Particle Text',
    description:
      'Canvas text built from particles that gather, rain, spiral or scan into place, repel from the cursor and burst on click.',
    deps: ['@vueuse/core'],
  },
  'peek-rating': {
    title: 'Peek Rating',
    description:
      'Star rating that lifts a wave of stars up to the pointer, then commits with a pop on click.',
    deps: ['@vueuse/core'],
  },
  'prompt-bar': {
    title: 'Prompt Bar',
    description:
      'Chat composer with @ sources, / commands, a model picker, an effort slider, dictation and attachment chips.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'pulse-heart': {
    title: 'Pulse Heart',
    description:
      'Like button whose glyph contracts to a dot, flips colour and swells back while the pill beats and the count rolls over.',
    deps: ['@vueuse/core'],
  },
  'refine-frame': {
    title: 'Refine Frame',
    description:
      'Media frame that steps an image through generation stages, from a coarse mosaic to sharp, without any layout shift.',
    deps: ['@vueuse/core'],
  },
  'rubber-segment': {
    title: 'Rubber Segment',
    description:
      'Segmented control whose rubber thumb stretches across the gap and squashes into place.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'scrub-field': {
    title: 'Scrub Field',
    description:
      'Number chip you drag to scrub, with rubber-band limits and click to type.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  shredder: {
    title: 'Shredder',
    description:
      'A list with a paper shredder at the bottom that cuts dragged rows into curling strips.',
    deps: ['@vueuse/core'],
  },
  'slide-commit': {
    title: 'Slide Commit',
    description:
      'Slide-to-confirm handle that spins while your action runs, then unfurls into a done pill or shakes back on failure.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'sling-button': {
    title: 'Sling Button',
    description:
      'Send button you pull back like a slingshot and release to fire, with a stretching band, a power arc and a particle burst.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'slosh-gauge': {
    title: 'Slosh Gauge',
    description:
      'Tank gauge whose liquid chases the value on a spring, tilts as it moves and splashes when it fills.',
    deps: ['@vueuse/core'],
  },
  'specular-button': {
    title: 'Specular Button',
    description:
      'Glass button with a WebGL2 rim light that rests on a corner, glides around the edge toward the cursor and flashes on press.',
    deps: ['@vueuse/core'],
  },
  'split-flap-text': {
    title: 'Split Flap Text',
    description:
      'A split-flap departure board whose tiles flip through random glyphs, one flap at a time, to show each new phrase.',
    deps: ['@vueuse/core'],
  },
  'spring-check': {
    title: 'Spring Check',
    description:
      'A checkbox row where one spring fills the box, draws the tick and strikes through the label.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'squish-switch': {
    title: 'Squish Switch',
    description:
      'Switch whose thumb stretches with speed and squashes against the end when you flick it.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'status-mark': {
    title: 'Status Mark',
    description:
      'Agent task status glyph that morphs from an idle ring to a progress arc, then a check.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'stroke-text': {
    title: 'Stroke Text',
    description:
      'SVG letter outlines draw themselves on one by one, then fill by wipe or fade, with dashed or dotted marching outlines and a lifted shadow.',
    deps: ['@vueuse/core'],
  },
  'swipe-row': {
    title: 'Swipe Row',
    description:
      'List row you swipe to reveal a drawer of actions; a full swipe leaps the delete block across and folds the row away.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'swipe-toast': {
    title: 'Swipe Toast',
    description:
      'Toast that swipes down to dismiss and burns a thin fuse along its edge for the time it has left.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'tear-ticket': {
    title: 'Tear Ticket',
    description:
      'A ticket whose perforated stub tears off by hand, fibre by fibre, then drops away and leaves a greyed, used ticket.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'tech-text': {
    title: 'Tech Text',
    description:
      'A canvas wordmark whose letters turn into dashed vector outlines under the cursor, with draggable spring letters and click ripples.',
    deps: ['@vueuse/core'],
  },
  'text-loop': {
    title: 'Text Loop',
    description:
      'A seamless text marquee along a curved SVG path, with a crossing band, hover pause, drag-to-fling and scroll boost.',
    deps: ['@vueuse/core'],
  },
  'thought-line': {
    title: 'Thought Line',
    description:
      'Reasoning trace header with a breathing glyph and live clock that folds its steps into one line when the work settles.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'voice-pill': {
    title: 'Voice Pill',
    description:
      'Mic button that opens into a capsule with a scrolling waveform and a timer while recording; tap to latch, hold to talk, slide left to cancel.',
    deps: ['@vueuse/core'],
  },
  'wake-slider': {
    title: 'Wake Slider',
    description:
      'Thumbless range slider of thin bars where drag speed raises a wake behind the handle.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'warm-tooltip': {
    title: 'Warm Tooltip',
    description:
      'A tooltip group where the first label waits, then siblings open instantly and the label glides between triggers while warm.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'warp-text': {
    title: 'Warp Text',
    description:
      'WebGL glass warp that bends and refracts text around the pointer, with bulge, pinch or swirl lenses and click shockwaves.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'acid-squares': {
    title: 'Acid Squares',
    description:
      'A rolling WebGL field of glossy squares that ripples under two drifting colored lights, with cursor press and click ripples.',
    deps: ['@vueuse/core'],
  },
  ballpit: {
    title: 'Ballpit',
    description:
      'A soft-lit pit of physics balls you can shove with the cursor, grab, throw and blast apart.',
    deps: ['@vueuse/core'],
  },
  crosshair: {
    title: 'Crosshair',
    description:
      'Crosshair cursor with live coordinates that locks onto links and buttons with measuring brackets and pulses on click.',
    deps: ['@vueuse/core'],
  },
  'crt-warp': {
    title: 'CRT Warp',
    description:
      'A blocky plasma glowing on a curved CRT, with scanlines, a phosphor mask, afterglow, a power-on intro, cursor magnet and click-to-change channel.',
    deps: ['@vueuse/core'],
  },
  cubes: {
    title: 'Cubes',
    description:
      'A grid of outlined 3D cubes that turn to face the cursor, spin when swept and ripple on click, drawn with instanced WebGL2.',
    deps: ['@vueuse/core'],
  },
  dither: {
    title: 'Dither',
    description:
      'Retro dithered waves with Bayer, halftone, line, crosshatch and noise patterns, palettes, cursor trails and click ripples.',
    deps: ['@vueuse/core'],
  },
  ferrofluid: {
    title: 'Ferrofluid',
    description:
      'A glossy sea of magnetic fluid where swells of spikes roll in, the cursor raises a crown and clicks send out a ring of spikes.',
    deps: ['@vueuse/core'],
  },
  'flux-lines': {
    title: 'Flux Lines',
    description:
      'Glowing flux lines trace a churning magnetic fluid. The cursor acts as a magnet that reveals and curls the lines, and a click stirs a swirl.',
    deps: ['@vueuse/core'],
  },
  'gradient-ascii': {
    title: 'Gradient ASCII',
    description:
      'Soft gradient glows drawn in ASCII characters that scramble under the cursor.',
    deps: [],
  },
  'gradient-waves': {
    title: 'Gradient Waves',
    description:
      'Ray-marched satin waves rolling in from a hazy horizon, with a light that follows the cursor and a swell on click.',
    deps: ['@vueuse/core'],
  },
  grainient: {
    title: 'Grainient',
    description:
      'Flowing grainy gradient that you drag like paint with the cursor and twist into swirls with a click.',
    deps: ['@vueuse/core'],
  },
  hyperspeed: {
    title: 'Hyperspeed',
    description:
      'Night highway of glowing light trails on a winding road that warps into hyperspace while you hold the pointer down.',
    deps: ['@vueuse/core', 'three'],
  },
  'light-tunnel': {
    title: 'Light Tunnel',
    description:
      'A swirling fibre-optic tunnel where comets of light race into depth, steered by the cursor.',
    deps: ['@vueuse/core'],
  },
  lightning: {
    title: 'Lightning',
    description:
      'Crackling, branching lightning that bends toward the cursor and strikes wherever you click.',
    deps: ['@vueuse/core'],
  },
  'molten-metal': {
    title: 'Molten Metal',
    description:
      'Swirling caustic filaments with white-hot cores that ignite on load, heat up under the cursor and flare on click.',
    deps: ['@vueuse/core'],
  },
  'pattern-waves': {
    title: 'Pattern Waves',
    description:
      'A lit halftone surface of dots, lines or glyphs that moves like draped silk and ripples under the cursor.',
    deps: ['@vueuse/core', 'ogl'],
  },
  radar: {
    title: 'Radar',
    description:
      'A radar scope whose sweep leaves a phosphor afterglow, lights up clutter and pings moving contacts. Sonar and tilted floor modes.',
    deps: ['@vueuse/core'],
  },
  ribbons: {
    title: 'Ribbons',
    description:
      'Springy WebGL2 ribbons that trail the cursor in lens, comet or even shapes, with optional wave, soft edges and tail fade.',
    deps: ['@vueuse/core'],
  },
  scanner: {
    title: 'Scanner',
    description:
      'Glowing interference lines swept by a scan beam, with a CRT finish, cursor lensing and click pings.',
    deps: ['@vueuse/core'],
  },
  'shape-waves': {
    title: 'Shape Waves',
    description:
      'A grid of triangles, circles and squares that morph and grow along noise waves, with text cutouts and cursor splash ripples.',
    deps: ['@vueuse/core'],
  },
  'sliced-waves': {
    title: 'Sliced Waves',
    description:
      'Waves of colored light sliced into glowing bars in depth, with a depth-of-field focus that follows the cursor.',
    deps: ['@vueuse/core'],
  },
  strands: {
    title: 'Strands',
    description:
      'Spectral strands that twist inside a frosted glass orb and swell into one bulge, reacting to voice level, the cursor and clicks.',
    deps: ['@vueuse/core'],
  },
  'web-threads': {
    title: 'Web Threads',
    description:
      'Glowing threads woven through pinch points that draw in one by one, light up under the cursor and carry light on click.',
    deps: ['@vueuse/core'],
  },
  'aero-shards': {
    title: 'Aero Shards',
    description:
      'Silk ribbons of thick glass shards streaming on layered depths among survey markers, catching light along their edges.',
    deps: ['@vueuse/core'],
  },
  'cursor-grid': {
    title: 'Cursor Grid',
    description:
      'A crisp grid whose cells light up and fade behind the cursor, with grid styles, tiles and click pulses.',
    deps: ['@vueuse/core'],
  },
  'dither-veil': {
    title: 'Dither Veil',
    description:
      'A 1-bit dithered photo the cursor burns through to full colour, knitting back cell by cell.',
    deps: ['ogl'],
  },
  'electric-logo': {
    title: 'Electric Logo',
    description:
      'Traces any logo or image into a living lightning outline with strands, arcs, hover charge and click ripples.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'ghost-fibers': {
    title: 'Ghost Fibers',
    description:
      'Layered ribbons of fine glowing fibers that twist, fold and drift through soft depth of field.',
    deps: ['@vueuse/core'],
  },
  'glow-cursor': {
    title: 'Glow Cursor',
    description:
      'A WebGL fluid trail of light that follows the cursor, drifts and cools as it fades, with a burst on click.',
    deps: ['@vueuse/core'],
  },
  'pixel-swap': {
    title: 'Pixel Swap',
    description:
      'New content builds in pixel by pixel in a springy wave that starts wherever the cursor enters.',
    deps: ['@vueuse/core'],
  },
  'swarm-cursor': {
    title: 'Swarm Cursor',
    description:
      'A liquid swarm of particles that flows after the cursor, curls into eddies and pours around hovered buttons.',
    deps: ['@vueuse/core'],
  },
  'scroll-expand': {
    title: 'Scroll Expand',
    description:
      'A rounded media frame that grows to full bleed as it scrolls through the viewport.',
    deps: ['@vueuse/core'],
  },
  'sticker-peel': {
    title: 'Sticker Peel',
    description:
      'A die-cut WebGL sticker that peels at the edge nearest the cursor and can be dragged, thrown and swung, in gloss, matte or holo finishes.',
    deps: ['@vueuse/core'],
  },
  'halftone-reveal': {
    title: 'Halftone Reveal',
    description:
      'Prints an image as a mono, duotone or color halftone whose dots swell into the real photo under the pointer.',
    deps: ['@vueuse/core'],
  },
  'micro-slats': {
    title: 'Micro Slats',
    description:
      'A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests and a cursor-stirred fluid trail.',
    deps: ['@vueuse/core', 'ogl'],
  },
  'ripple-distortion': {
    title: 'Ripple Distortion',
    description:
      'Pointer-driven water displacement that warps an image and leaves a decaying wake.',
    deps: ['@vueuse/core', 'ogl'],
  },
  topography: {
    title: 'Topography',
    description:
      'A 3D landscape drawn in glowing contour lines that rises under the cursor, with light pulses on click.',
    deps: ['@vueuse/core'],
  },
  'annotated-text': {
    title: 'Annotated Text',
    description:
      'Inline text marked with hand-drawn SVG circles, underlines, highlights, brackets and cross-outs that draw in once when they scroll into view.',
    deps: ['@vueuse/core'],
  },
  'ascii-effect': {
    title: 'ASCII Effect',
    description:
      'Renders an image as dithered ASCII characters on a canvas, with static, flowing pointer-ripple, and glitch-reveal variants.',
    deps: ['@vueuse/core'],
  },
  'aurora-flow': {
    title: 'Aurora Flow',
    description:
      'WebGL hero background with layered silk flow, diffused aurora light, film grain and a soft pointer bend, with twelve palette presets.',
    deps: ['@vueuse/core'],
  },
  'case-study-flip-stack': {
    title: 'Case Study Flip Stack',
    description:
      'Editorial case study cards that fold upward on scroll to reveal the next story beneath.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'fisheye-infinite-grid': {
    title: 'Fisheye Infinite Grid',
    description:
      'A draggable image wall that repeats on both axes and bends through one fisheye lens, with momentum, wheel and arrow-key panning.',
    deps: ['@vueuse/core'],
  },
  'flipping-word-swap': {
    title: 'Flipping Word Swap',
    description:
      'A word that flips into a second word one character at a time on hover, focus or tap, and flips back when you leave.',
    deps: ['@vueuse/core'],
  },
  'grain-gradient': {
    title: 'Grain Gradient',
    description:
      'A breathing color field with a soft curved shadow, flowing light and fine film grain, drawn with WebGL.',
    deps: ['@vueuse/core'],
  },
  'hover-transition': {
    title: 'Hover Transition',
    description:
      'A focusable wrapper that swaps a default and a hover slot with one of eight transitions from nine directions, plus a light tilt and glare.',
    deps: ['@vueuse/core'],
  },
  'lens-clock': {
    title: 'Lens Clock',
    description:
      'A live clock that frames a corner of a large dial, panning with the hour hand while the edges blur out of focus.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'newsletter-bookshelf': {
    title: 'Newsletter Bookshelf',
    description:
      'A three.js shelf of cloth-bound books for a newsletter archive. Browse sideways, hover to lift a spine, click to pull a book forward.',
    deps: ['@vueuse/core', 'three'],
  },
  'pixel-image-trail': {
    title: 'Pixel Image Trail',
    description:
      'An image reveal made from cursor-painted squares that expire into a bounded pixel trail.',
    deps: ['@vueuse/core'],
  },
  'scroll-tilted-grid': {
    title: 'Scroll Tilted Grid',
    description:
      'A two-column image gallery whose frames tilt, blur and dim at the viewport edges and settle into focus as they cross the center.',
    deps: ['@vueuse/core'],
  },
  'spectral-ribbon': {
    title: 'Spectral Ribbon',
    description:
      'A soft spectral light ribbon on black with slow liquid motion and a rainbow fringe, drawn by one WebGL fragment shader.',
    deps: ['@vueuse/core'],
  },
  'spiral-3d-slider': {
    title: 'Spiral 3D Slider',
    description:
      'An autoplaying image gallery that flows along a 3D spiral of curved WebGL planes and moves with wheel and page scroll.',
    deps: ['@vueuse/core', 'three'],
  },
  'text-morph': {
    title: 'Text Morph',
    description:
      'Words, numbers or prices melt into each other on a timer through blur and an SVG alpha-threshold filter, inheriting parent typography.',
    deps: ['@vueuse/core'],
  },
  'wheel-carousel': {
    title: 'Wheel Carousel',
    description:
      'A rotating-wheel picker with inertial drag and scroll, curved fading labels, and a crossfading image for the active item.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'paper-lens-distortion': {
    title: 'Lens Distortion',
    description:
      'An image filter that splits an image into shifting color layers like lens chromatic aberration and warps it like barrel or pincushion distortion. Ported from Paper Shaders (Apache-2.0).',
    deps: ['@paper-design/shaders'],
  },
  'clean-table': {
    title: 'Clean Table',
    description:
      'A quiet, paginated table with segmented tabs, a keyboard-focused search, zebra rows, mono columns, status pills and row selection.',
    deps: ['@tanstack/vue-table', '@vueuse/core'],
  },
  'control-card': {
    title: 'Control Card',
    description:
      'A frosted-glass device card with a round power button, a device name and a boxed stat, made to sit over a photo.',
    deps: [],
  },
  'data-table': {
    title: 'Data Table',
    description:
      'A sortable, searchable table on TanStack Table with cell slots and a flash on rows whose values change.',
    deps: ['@tanstack/vue-table'],
  },
  'status-panel': {
    title: 'Status Panel',
    description:
      'Service health lamps with an overall status, uptime and latency, plus a live event log.',
    deps: [],
  },
};

function buildRegistryItem(slug: string): RegistryItem | null {
  const meta = COMPONENTS[slug];
  if (!meta) {
    console.warn(`No metadata for component: ${slug}`);
    return null;
  }

  const componentDir = join(REGISTRY_DIR, slug);

  if (!existsSync(componentDir)) {
    console.warn(`Directory not found: ${componentDir}`);
    return null;
  }

  const isMount = slug === PAPER_SHADER_MOUNT;
  const isLib = isMount || slug === CHART_LIB;
  const itemType: RegistryItemType = isLib ? 'registry:lib' : 'registry:ui';
  const files: RegistryFile[] = [];

  // Sorted so registry JSON is deterministic across runtimes/filesystems.
  const entries = readdirSync(componentDir).sort();
  for (const entry of entries) {
    const fullPath = join(componentDir, entry);
    if (!statSync(fullPath).isFile()) continue;
    if (!entry.endsWith('.vue') && !entry.endsWith('.ts')) continue;

    const content = readFileSync(fullPath, 'utf-8');
    files.push({
      path: `registry/new-york/${slug}/${entry}`,
      content,
      type: itemType,
      target: `components/ui/${slug}/${entry}`,
    });
  }

  if (files.length === 0) {
    console.warn(`No files found in: ${componentDir}`);
    return null;
  }

  const needsMount = !isMount && slug.startsWith('paper-');
  const registryDependencies = [
    ...(needsMount ? [PAPER_SHADER_MOUNT_URL] : []),
    ...(CHART_COMPONENTS.has(slug) ? [CHART_LIB_URL] : []),
  ];

  return {
    $schema: 'https://shadcn-vue.com/schema/registry-item.json',
    name: slug,
    type: itemType,
    title: meta.title,
    description: meta.description,
    dependencies: meta.deps,
    ...(registryDependencies.length > 0 ? { registryDependencies } : {}),
    files,
  };
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const indexItems: RegistryIndex['items'] = [];
  let built = 0;
  let skipped = 0;

  for (const slug of Object.keys(COMPONENTS)) {
    const item = buildRegistryItem(slug);
    if (!item) {
      skipped++;
      continue;
    }

    const outPath = join(OUTPUT_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(item, null, 2) + '\n');
    console.log(`  ✓ ${slug}.json (${item.files.length} files)`);
    built++;

    indexItems.push({
      name: slug,
      type: item.type,
      title: item.title,
      description: item.description,
    });
  }

  const registryIndex: RegistryIndex = {
    $schema: 'https://shadcn-vue.com/schema/registry.json',
    name: 'nxui',
    homepage: 'https://nxui.geoql.in',
    items: indexItems,
  };

  const indexPath = join(OUTPUT_DIR, 'registry.json');
  writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2) + '\n');
  console.log(`\n  ✓ registry.json (${indexItems.length} items)`);

  // Run oxfmt over the freshly-written JSONs so CI's format:check stays green.
  // oxfmt collapses short arrays/objects to one line; JSON.stringify always
  // expands them, so without this pass every regen produces lint failures.
  const fmt = spawnSync('pnpm', ['exec', 'oxfmt', '--write', OUTPUT_DIR], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (fmt.status !== 0) {
    console.error(`oxfmt failed with status ${fmt.status}`);
    process.exit(fmt.status ?? 1);
  }

  console.log(`\nDone: ${built} built, ${skipped} skipped`);
}

main();
