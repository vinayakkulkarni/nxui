import type { NavGroup } from '~/types/docs';

export function useNavigation(): NavGroup[] {
  return [
    {
      title: 'Getting Started',
      items: [{ title: 'Introduction', href: '/docs' }],
    },
    {
      title: 'Text Animations',
      items: [
        { title: 'Hyper Text', href: '/docs/components/hyper-text' },
        { title: 'Text Animate', href: '/docs/components/text-animate' },
        { title: 'True Focus', href: '/docs/components/true-focus' },
        {
          title: 'Velocity Scroll',
          href: '/docs/components/scroll-based-velocity',
        },
      ],
    },
    {
      title: 'Components',
      items: [
        { title: 'Auth Modal', href: '/docs/components/auth-modal' },
        { title: 'Circuit Board', href: '/docs/components/circuit-board' },
        {
          title: 'Collection Surfer',
          href: '/docs/components/collection-surfer',
        },
        { title: 'Command Menu', href: '/docs/components/command-menu' },
        {
          title: 'Flight Status Card',
          href: '/docs/components/flight-status-card',
        },
        {
          title: 'Github Calendar',
          href: '/docs/components/github-calendar',
        },
        { title: 'Magnetic Dock', href: '/docs/components/magnetic-dock' },
        { title: 'Showcase Card', href: '/docs/components/showcase-card' },
        { title: 'Spotlight Card', href: '/docs/components/spotlight-card' },
        {
          title: 'Testimonial Marquee',
          href: '/docs/components/testimonial-marquee',
        },
      ],
    },
    {
      title: 'Hero Backgrounds',
      items: [
        { title: 'Hero Geometric', href: '/docs/components/hero-geometric' },
      ],
    },
    {
      title: 'Visual Effects',
      items: [
        { title: 'Border Beam', href: '/docs/components/border-beam' },
        {
          title: 'Dither Gradient',
          href: '/docs/components/dither-gradient',
        },
        { title: 'Liquid Blob', href: '/docs/components/liquid-blob' },
        { title: 'Magnet Lines', href: '/docs/components/magnet-lines' },
        { title: 'Matrix Rain', href: '/docs/components/matrix-rain' },
        { title: 'Noise Texture', href: '/docs/components/noise-texture' },
        {
          title: 'Particle Galaxy',
          href: '/docs/components/particle-galaxy',
        },
        { title: 'Pixel Canvas', href: '/docs/components/pixel-canvas' },
      ],
    },
    {
      title: 'Buttons',
      items: [
        {
          title: 'Interactive Hover Button',
          href: '/docs/components/interactive-hover-button',
        },
        {
          title: 'Pulsating Button',
          href: '/docs/components/pulsating-button',
        },
        { title: 'Shimmer Button', href: '/docs/components/shimmer-button' },
      ],
    },
  ];
}
