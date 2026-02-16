import type { NavGroup } from '~/types/docs';

export const docsNav: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [{ title: 'Introduction', path: '/docs' }],
  },
  {
    title: 'Text Animations',
    items: [
      { title: 'Hyper Text', path: '/docs/text-animations/hyper-text' },
      { title: 'Text Animate', path: '/docs/text-animations/text-animate' },
      { title: 'True Focus', path: '/docs/text-animations/true-focus' },
      {
        title: 'Scroll Based Velocity',
        path: '/docs/text-animations/scroll-based-velocity',
      },
    ],
  },
  {
    title: 'Components',
    items: [
      { title: 'Auth Modal', path: '/docs/components/auth-modal' },
      { title: 'Node Diagram', path: '/docs/components/node-diagram' },
      {
        title: 'Collection Surfer',
        path: '/docs/components/collection-surfer',
      },
      { title: 'Command Menu', path: '/docs/components/command-menu' },
      {
        title: 'Flight Status Card',
        path: '/docs/components/flight-status-card',
      },
      { title: 'GitHub Calendar', path: '/docs/components/github-calendar' },
      { title: 'Magnetic Dock', path: '/docs/components/magnetic-dock' },
      { title: 'Showcase Card', path: '/docs/components/showcase-card' },
      { title: 'Spotlight Card', path: '/docs/components/spotlight-card' },
      {
        title: 'Testimonial Marquee',
        path: '/docs/components/testimonial-marquee',
      },
    ],
  },

  {
    title: 'Visual Effects',
    items: [
      { title: 'Border Beam', path: '/docs/visual-effects/border-beam' },
      {
        title: 'Closing Plasma',
        path: '/docs/visual-effects/closing-plasma',
      },
      {
        title: 'Dither Gradient',
        path: '/docs/visual-effects/dither-gradient',
      },
      { title: 'Liquid Blob', path: '/docs/visual-effects/liquid-blob' },
      { title: 'Magnet Lines', path: '/docs/visual-effects/magnet-lines' },
      { title: 'Matrix Rain', path: '/docs/visual-effects/matrix-rain' },
      { title: 'Noise Texture', path: '/docs/visual-effects/noise-texture' },
      {
        title: 'Particle Galaxy',
        path: '/docs/visual-effects/particle-galaxy',
      },
      { title: 'Pixel Canvas', path: '/docs/visual-effects/pixel-canvas' },
    ],
  },
  {
    title: 'Buttons',
    items: [
      {
        title: 'Interactive Hover Button',
        path: '/docs/buttons/interactive-hover-button',
      },
      {
        title: 'Pulsating Button',
        path: '/docs/buttons/pulsating-button',
      },
      { title: 'Shimmer Button', path: '/docs/buttons/shimmer-button' },
    ],
  },
  {
    title: 'Hero Backgrounds',
    items: [
      {
        title: 'Dither Prism Hero',
        path: '/docs/hero-backgrounds/dither-prism-hero',
      },
      {
        title: 'Hero Geometric',
        path: '/docs/hero-backgrounds/hero-geometric',
      },
      {
        title: 'WebGL Liquid',
        path: '/docs/hero-backgrounds/webgl-liquid',
      },
    ],
  },
];
