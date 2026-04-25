import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_DIR = join(ROOT, 'registry', 'new-york');
const OUTPUT_DIR = join(ROOT, 'public', 'r');

interface RegistryFile {
  path: string;
  content: string;
  type: 'registry:ui';
  target: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: 'registry:ui';
  title: string;
  description: string;
  dependencies: string[];
  files: RegistryFile[];
}

interface RegistryIndex {
  $schema: string;
  name: string;
  homepage: string;
  items: Array<{
    name: string;
    type: 'registry:ui';
    title: string;
    description: string;
  }>;
}

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
  'text-animate': {
    title: 'Text Animate',
    description:
      'Versatile text animation component with multiple animation types and split modes.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'true-focus': {
    title: 'True Focus',
    description:
      'A text component that highlights words in sequence with a glowing focus effect.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'scroll-based-velocity': {
    title: 'Scroll Based Velocity',
    description:
      'Text that scrolls horizontally with velocity based on scroll speed.',
    deps: ['@vueuse/core'],
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
    description: 'A card that follows the cursor with a spotlight glow effect.',
    deps: ['@vueuse/core'],
  },
  'showcase-card': {
    title: 'Showcase Card',
    description: 'A card with 3D tilt effect that responds to mouse movement.',
    deps: ['@vueuse/core'],
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
    description: 'Lines that bend toward the cursor like a magnetic field.',
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
    description: 'A GitHub-style contribution heatmap calendar.',
    deps: ['@vueuse/core'],
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
      'RGB split and distortion glitch effect with jitter animations and optional hover trigger.',
    deps: [],
  },
  'circular-text': {
    title: 'Circular Text',
    description:
      'Characters positioned around a circle with continuous spin animation.',
    deps: [],
  },
  shuffle: {
    title: 'Shuffle',
    description: 'Random character shuffle that reveals text left-to-right.',
    deps: ['@vueuse/core'],
  },
  'shiny-text': {
    title: 'Shiny Text',
    description:
      'A metallic sheen sweep effect across text with theme-aware gradients.',
    deps: [],
  },
  'gradient-text': {
    title: 'Gradient Text',
    description:
      'Animated flowing gradient across text with customizable colors and speed.',
    deps: [],
  },
  'count-up': {
    title: 'Count Up',
    description:
      'Animated number counter with easeOutExpo easing, triggered on scroll into view.',
    deps: ['@vueuse/core'],
  },
  'split-text': {
    title: 'Split Text',
    description:
      'Staggered character or word entrance animation triggered on scroll into view.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'blur-text': {
    title: 'Blur Text',
    description:
      'Words or letters animate from blurred to clear with a staggered entrance.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'rotating-text': {
    title: 'Rotating Text',
    description:
      'Cycle through an array of text phrases with staggered character transitions.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'text-type': {
    title: 'Text Type',
    description:
      'Typewriter effect with character-by-character typing, delete-and-retype loop, and blinking cursor.',
    deps: ['@vueuse/core'],
  },
  'fuzzy-text': {
    title: 'Fuzzy Text',
    description:
      'Canvas-based vibrating fuzzy text with horizontal displacement that intensifies on hover.',
    deps: ['@vueuse/core'],
  },
  'decrypted-text': {
    title: 'Decrypted Text',
    description:
      'Hacker-style text decryption effect that scrambles characters before revealing the original text.',
    deps: ['@vueuse/core'],
  },
  'variable-proximity': {
    title: 'Variable Proximity',
    description:
      'Text that changes font variation settings based on cursor proximity.',
    deps: ['@vueuse/core'],
  },
  'text-pressure': {
    title: 'Text Pressure',
    description:
      'Variable font text responding to cursor with weight, width, italic changes.',
    deps: ['@vueuse/core'],
  },
  'scroll-reveal': {
    title: 'Scroll Reveal',
    description: 'Text revealed word by word on scroll with optional blur.',
    deps: ['@vueuse/core'],
  },
  'scroll-float': {
    title: 'Scroll Float',
    description: 'Characters float up with scale distortion on scroll.',
    deps: ['@vueuse/core'],
  },
  'text-cursor': {
    title: 'Text Cursor',
    description: 'Cursor trail that drops text along the mouse path.',
    deps: ['@vueuse/core', 'motion-v'],
  },
  'scrambled-text': {
    title: 'Scrambled Text',
    description: 'Proximity-based character scrambling effect.',
    deps: ['@vueuse/core'],
  },
  'curved-loop': {
    title: 'Curved Loop',
    description:
      'Text scrolling along a curved SVG path with drag interaction.',
    deps: [],
  },
  'logo-loop': {
    title: 'Logo Loop',
    description:
      'Infinite scrolling logo marquee with smooth animation and fade edges.',
    deps: ['@vueuse/core'],
  },
  aurora: {
    title: 'Aurora',
    description:
      'WebGL aurora borealis effect with simplex noise and configurable color stops.',
    deps: ['ogl'],
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
      'A grid of random characters with color glitching and vignette overlays.',
    deps: ['@vueuse/core'],
  },
  lightning: {
    title: 'Lightning',
    description:
      'WebGL-powered lightning bolt effect with fbm noise and customizable hue.',
    deps: ['@vueuse/core'],
  },
  iridescence: {
    title: 'Iridescence',
    description:
      'Mesmerizing iridescent color waves with mouse-reactive distortion.',
    deps: ['ogl', '@vueuse/core'],
  },
  'liquid-chrome': {
    title: 'Liquid Chrome',
    description:
      'Interactive liquid chrome effect with ripple distortion and mouse tracking.',
    deps: ['ogl', '@vueuse/core'],
  },
  balatro: {
    title: 'Balatro',
    description:
      'Psychedelic spin-paint background with configurable colors and animation speed.',
    deps: ['ogl', '@vueuse/core'],
  },
  waves: {
    title: 'Waves',
    description:
      'Animated Perlin noise wave lines with configurable colors, amplitude, and density.',
    deps: ['@vueuse/core'],
  },
  threads: {
    title: 'Threads',
    description:
      'Animated Perlin noise thread lines with mouse-reactive distortion.',
    deps: ['ogl', '@vueuse/core'],
  },
  orb: {
    title: 'Orb',
    description:
      'Glowing orb with hue-shifted noise, hover distortion, and optional rotation.',
    deps: ['ogl', '@vueuse/core'],
  },
  silk: {
    title: 'Silk',
    description:
      'Silky fabric-like shader background with flowing noise patterns.',
    deps: ['three', '@vueuse/core'],
  },
  'floating-lines': {
    title: 'Floating Lines',
    description:
      'Multi-layered glowing wave lines with cursor-reactive bending.',
    deps: ['three', '@vueuse/core'],
  },
  beams: {
    title: 'Beams',
    description:
      '3D light beam planes with Perlin noise deformation and directional lighting.',
    deps: ['three', '@vueuse/core'],
  },
  'dark-veil': {
    title: 'Dark Veil',
    description:
      'CPPN neural network shader background with hue shift, scanlines, and warp distortion.',
    deps: ['ogl', '@vueuse/core'],
  },
  grainient: {
    title: 'Grainient',
    description:
      'Animated gradient background with noise grain and smooth color blending.',
    deps: ['ogl', '@vueuse/core'],
  },
  'faulty-terminal': {
    title: 'Faulty Terminal',
    description:
      'Matrix-style hacker terminal with digit patterns, scanlines, and chromatic aberration.',
    deps: ['ogl', '@vueuse/core'],
  },
  'gradient-blinds': {
    title: 'Gradient Blinds',
    description:
      'Animated gradient blinds with spotlight, mouse tracking, and up to 8 color stops.',
    deps: ['ogl', '@vueuse/core'],
  },
  'color-bends': {
    title: 'Color Bends',
    description:
      'Complex warp shader with mouse parallax, auto-rotation, and up to 8 custom colors.',
    deps: ['three', '@vueuse/core'],
  },
  'light-pillar': {
    title: 'Light Pillar',
    description:
      '3D raymarched light pillar with configurable colors, quality settings, and optional mouse interaction.',
    deps: ['three', '@vueuse/core'],
  },
  'light-rays': {
    title: 'Light Rays',
    description:
      'Animated light rays emanating from a configurable origin with mouse following and color controls.',
    deps: ['ogl', '@vueuse/core'],
  },
  'ripple-grid': {
    title: 'Ripple Grid',
    description:
      'Animated sine-wave ripple grid with mouse interaction, rainbow mode, and vignette.',
    deps: ['ogl', '@vueuse/core'],
  },
  'pixel-snow': {
    title: 'Pixel Snow',
    description:
      '3D voxel-raymarched pixelated snowfall with configurable flake shapes and wind direction.',
    deps: ['three', '@vueuse/core'],
  },
  'prismatic-burst': {
    title: 'Prismatic Burst',
    description:
      'WebGL 2 raymarched spectral burst with configurable colors, distortion, and 3D animation modes.',
    deps: ['ogl', '@vueuse/core'],
  },
  'liquid-ether': {
    title: 'Liquid Ether',
    description:
      'Full Navier-Stokes fluid simulation with mouse interaction, auto-demo driver, and customizable color palette.',
    deps: ['three', '@vueuse/core'],
  },
  'pixel-blast': {
    title: 'Pixel Blast',
    description:
      'Dithered pixel pattern with Bayer matrix, FBM noise, click ripples, and configurable shapes.',
    deps: ['three', '@vueuse/core'],
  },
  ballpit: {
    title: 'Ballpit',
    description:
      '3D physics-based ball pit with instanced meshes, subsurface scattering, and cursor interaction.',
    deps: ['three', '@vueuse/core'],
  },
  'dot-grid': {
    title: 'Dot Grid',
    description:
      'Interactive canvas dot grid with velocity-based impulse, click shockwaves, and elastic return.',
    deps: ['@vueuse/core'],
  },
  'grid-distortion': {
    title: 'Grid Distortion',
    description:
      'Three.js shader-based image distortion that warps a texture in response to mouse movement.',
    deps: ['three', '@vueuse/core'],
  },
  'grid-motion': {
    title: 'Grid Motion',
    description:
      'A rotated grid of items that shifts horizontally based on cursor position with smooth easing.',
    deps: ['@vueuse/core'],
  },
  'animated-content': {
    title: 'Animated Content',
    description:
      'Scroll-triggered entrance animation with configurable direction, distance, and easing.',
    deps: ['@vueuse/core'],
  },
  'fade-content': {
    title: 'Fade Content',
    description: 'Scroll-triggered fade-in with optional blur effect.',
    deps: ['@vueuse/core'],
  },
  'click-spark': {
    title: 'Click Spark',
    description: 'Click-triggered spark burst animation rendered on canvas.',
    deps: ['@vueuse/core'],
  },
  'star-border': {
    title: 'Star Border',
    description:
      'Animated glowing border effect with dual radial gradient beams.',
    deps: [],
  },
  magnet: {
    title: 'Magnet',
    description:
      'Element that magnetically pulls toward the cursor when nearby.',
    deps: ['@vueuse/core'],
  },
  crosshair: {
    title: 'Crosshair',
    description:
      'Smooth crosshair cursor replacement with horizontal and vertical lines.',
    deps: ['@vueuse/core'],
  },
  'gradual-blur': {
    title: 'Gradual Blur',
    description:
      'Layered backdrop-filter blur gradient overlay for smooth edge fading.',
    deps: [],
  },
  'glare-hover': {
    title: 'Glare Hover',
    description:
      'A glare sweep animation on hover with configurable angle, size, and color.',
    deps: [],
  },
  ribbons: {
    title: 'Ribbons',
    description:
      'Interactive OGL ribbon lines that follow mouse movement with spring physics.',
    deps: ['ogl', '@vueuse/core'],
  },
  'pixel-transition': {
    title: 'Pixel Transition',
    description:
      'Pixelated grid transition that reveals a second content layer on hover.',
    deps: [],
  },
  'electric-border': {
    title: 'Electric Border',
    description:
      'Animated electric border with noise-driven distortion and glow effects.',
    deps: ['@vueuse/core'],
  },
  'meta-balls': {
    title: 'Meta Balls',
    description:
      'WebGL 2 metaball shader with cursor-reactive ball and configurable colors.',
    deps: ['ogl', '@vueuse/core'],
  },
  'blob-cursor': {
    title: 'Blob Cursor',
    description:
      'Gooey blob cursor trail with SVG filter and configurable appearance.',
    deps: ['@vueuse/core'],
  },
  cubes: {
    title: 'Cubes',
    description:
      'Interactive 3D CSS cube grid that tilts toward cursor with auto-animation.',
    deps: ['@vueuse/core'],
  },
  'shape-blur': {
    title: 'Shape Blur',
    description:
      'SDF shape with cursor-reactive blur distortion rendered via Three.js shaders.',
    deps: ['three', '@vueuse/core'],
  },
  stack: {
    title: 'Stack',
    description:
      'Draggable card stack with spring animations and send-to-back gesture.',
    deps: ['@vueuse/core'],
  },
  'tilted-card': {
    title: 'Tilted Card',
    description:
      '3D tilting card that follows cursor with spring damping and tooltip caption.',
    deps: ['@vueuse/core'],
  },
  'decay-card': {
    title: 'Decay Card',
    description:
      'SVG displacement map card that warps on cursor movement with lerp physics.',
    deps: ['@vueuse/core'],
  },
  'elastic-slider': {
    title: 'Elastic Slider',
    description:
      'Draggable slider with elastic overflow bounce and animated icons.',
    deps: [],
  },
  'bounce-cards': {
    title: 'Bounce Cards',
    description:
      'Fan of image cards with staggered entrance and hover push animation.',
    deps: [],
  },
  'pixel-card': {
    title: 'Pixel Card',
    description:
      'Canvas pixel shimmer card with hover-activated sparkle effect and preset variants.',
    deps: ['@vueuse/core'],
  },
  stepper: {
    title: 'Stepper',
    description:
      'Multi-step wizard with animated step indicators and slide transitions.',
    deps: [],
  },
  carousel: {
    title: 'Carousel',
    description:
      'Draggable card carousel with 3D perspective rotation and dot indicators.',
    deps: ['@vueuse/core'],
  },
  'flowing-menu': {
    title: 'Flowing Menu',
    description:
      'Hover-activated marquee menu with edge-aware slide-in animation.',
    deps: [],
  },
  'flying-posters': {
    title: 'Flying Posters',
    description:
      'OGL-powered vertical scroll gallery with rotating poster distortion.',
    deps: ['ogl', '@vueuse/core'],
  },
  'circular-gallery': {
    title: 'Circular Gallery',
    description:
      'OGL-powered curved image gallery with drag/scroll navigation and wave deformation.',
    deps: ['ogl', '@vueuse/core'],
  },
  counter: {
    title: 'Counter',
    description:
      'Animated number counter with spring-physics digit rolling and gradient fade overlays.',
    deps: [],
  },
  'animated-list': {
    title: 'Animated List',
    description:
      'Scroll-triggered list with scale entrance, keyboard navigation, and gradient edges.',
    deps: ['@vueuse/core'],
  },
  folder: {
    title: 'Folder',
    description:
      'Pure CSS 3D folder with open/close animation and magnetic paper hover.',
    deps: [],
  },
  'glass-icons': {
    title: 'Glass Icons',
    description:
      'Glass morphism icon buttons with gradient background, 3D tilt, and label reveal on hover.',
    deps: [],
  },
  'gooey-nav': {
    title: 'Gooey Nav',
    description:
      'Particle-burst navigation with SVG gooey filter effect and spring animation.',
    deps: ['@vueuse/core'],
  },
  'bubble-menu': {
    title: 'Bubble Menu',
    description:
      'Animated full-screen pill navigation with staggered scale-in and rotation.',
    deps: [],
  },
  'card-swap': {
    title: 'Card Swap',
    description:
      'Stacked card carousel that cycles the front card to the back with 3D transforms.',
    deps: [],
  },
  'chroma-grid': {
    title: 'Chroma Grid',
    description:
      'Profile card grid with mouse-tracking spotlight reveal and per-card hover glow.',
    deps: ['@vueuse/core'],
  },
  'magic-bento': {
    title: 'Magic Bento',
    description:
      'Interactive bento grid with spotlight tracking, particle effects, border glow, and magnetism.',
    deps: ['@vueuse/core'],
  },
  masonry: {
    title: 'Masonry',
    description:
      'Responsive masonry image grid with blur-to-focus entrance animation and hover scaling.',
    deps: ['@vueuse/core'],
  },
  'card-nav': {
    title: 'Card Nav',
    description:
      'Expandable navbar with staggered card reveal, hamburger toggle, and color-coded panels.',
    deps: ['@vueuse/core'],
  },
  'glass-surface': {
    title: 'Glass Surface',
    description:
      'SVG displacement-based glass distortion with chromatic aberration and frosted backdrop filter.',
    deps: ['@vueuse/core'],
  },
  'profile-card': {
    title: 'Profile Card',
    description:
      'Holographic tilt card with pointer-tracking 3D transforms, rainbow shine, and avatar parallax.',
    deps: ['@vueuse/core'],
  },
  'reflective-card': {
    title: 'Reflective Card',
    description:
      'Metallic ID card with SVG displacement filters, live webcam background, and chromatic aberration.',
    deps: [],
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
    title: 'Cursor Driven Particle Typography',
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
      'A prismatic light refraction background rendered with WebGL shaders via OGL.',
    deps: ['ogl'],
  },
  radar: {
    title: 'Radar',
    description:
      'An animated radar sweep background with concentric rings and radial spokes.',
    deps: ['ogl'],
  },
  'shape-grid': {
    title: 'Shape Grid',
    description:
      'An animated grid of shapes (squares, hexagons, circles, triangles) with hover trail effects.',
    deps: ['@vueuse/core'],
  },
  'magic-rings': {
    title: 'Magic Rings',
    description:
      'Concentric animated rings rendered with Three.js shaders, featuring glow and parallax effects.',
    deps: ['three'],
  },
  'evil-eye': {
    title: 'Evil Eye',
    description:
      'An animated evil eye background with flame effects and cursor-tracking pupil.',
    deps: ['ogl'],
  },
  'soft-aurora': {
    title: 'Soft Aurora',
    description:
      'A WebGL aurora borealis background effect with perlin noise, cosine gradient coloring, and mouse interaction.',
    deps: ['ogl'],
  },
  'line-waves': {
    title: 'Line Waves',
    description:
      'A WebGL animated line wave background with warping, color cycling, and mouse interaction.',
    deps: ['ogl'],
  },
  'border-glow': {
    title: 'Border Glow',
    description:
      'A CSS-driven directional glow card that tracks cursor position and proximity to edges.',
    deps: [],
  },
  noise: {
    title: 'Noise',
    description:
      'An animated canvas noise grain overlay for adding texture to backgrounds and sections.',
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
      'A WebGL2 plasma background with 60-iteration ray march shader, mouse interaction, and configurable direction.',
    deps: ['ogl', '@vueuse/core'],
  },
  'editorial-orbs': {
    title: 'Editorial Orbs',
    description:
      'Bouncing glowing orbs with text that dynamically flows around them in multi-column layout.',
    deps: ['@vueuse/core'],
  },
  dither: {
    title: 'Dither',
    description:
      'Retro Bayer-matrix dithered noise shader background with cursor-reactive wave distortion powered by Three.js postprocessing.',
    deps: ['three', 'postprocessing', '@vueuse/core'],
  },
  'plasma-wave': {
    title: 'Plasma Wave',
    description:
      'Raymarched plasma waves with dual-wave interference, configurable colors, focal length, and rotation rendered with OGL.',
    deps: ['ogl', '@vueuse/core'],
  },
  'dot-field': {
    title: 'Dot Field',
    description:
      'Interactive canvas dot grid with cursor bulge, glow, sparkle, and wave effects with smooth physics-based response.',
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

  const files: RegistryFile[] = [];

  const entries = readdirSync(componentDir);
  for (const entry of entries) {
    const fullPath = join(componentDir, entry);
    if (!statSync(fullPath).isFile()) continue;
    if (!entry.endsWith('.vue') && !entry.endsWith('.ts')) continue;

    const content = readFileSync(fullPath, 'utf-8');
    files.push({
      path: `registry/new-york/${slug}/${entry}`,
      content,
      type: 'registry:ui',
      target: `components/ui/${slug}/${entry}`,
    });
  }

  if (files.length === 0) {
    console.warn(`No files found in: ${componentDir}`);
    return null;
  }

  return {
    $schema: 'https://shadcn-vue.com/schema/registry-item.json',
    name: slug,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    dependencies: meta.deps,
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
      type: 'registry:ui',
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

  console.log(`\nDone: ${built} built, ${skipped} skipped`);
}

main();
