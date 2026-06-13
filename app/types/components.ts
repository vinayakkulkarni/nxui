// Barrel re-export from per-slug registry type files.
// Each registry component dir is self-contained: it owns its types.ts so that
// consumers installing via shadcn-vue CLI never need this path. App code keeps
// importing from '~/types/components' through this barrel.

export * from '@registry/new-york/animated-gradient/types';
export * from '@registry/new-york/auth-modal/types';
export * from '@registry/new-york/closing-plasma/types';
export * from '@registry/new-york/collection-surfer/types';
export * from '@registry/new-york/command-menu/types';
export * from '@registry/new-york/dither/types';
export * from '@registry/new-york/dither-prism-hero/types';
export * from '@registry/new-york/dock/types';
export * from '@registry/new-york/dot-field/types';
export * from '@registry/new-york/editorial-orbs/types';
export * from '@registry/new-york/eye-tracking/types';
export * from '@registry/new-york/flight-status-card/types';
export * from '@registry/new-york/github-calendar/types';
export * from '@registry/new-york/glass-icons/types';
export * from '@registry/new-york/hero-geometric/types';
export * from '@registry/new-york/image-ripple-effect/types';
export * from '@registry/new-york/infinite-image-field/types';
export * from '@registry/new-york/mac-keyboard/types';
export * from '@registry/new-york/magnetic-dock/types';
export * from '@registry/new-york/music-player/types';
export * from '@registry/new-york/node-diagram/types';
export * from '@registry/new-york/orbit-card-stack/types';
export * from '@registry/new-york/particle-galaxy/types';
export * from '@registry/new-york/pixel-canvas/types';
export * from '@registry/new-york/plasma/types';
export * from '@registry/new-york/plasma-wave/types';
export * from '@registry/new-york/scroll-split-card/types';
export * from '@registry/new-york/showcase-card/types';
export * from '@registry/new-york/spotlight-card/types';
export * from '@registry/new-york/split-flap-display/types';
export * from '@registry/new-york/stack/types';
export * from '@registry/new-york/sticky-scroll-cards/types';
export * from '@registry/new-york/testimonial-marquee/types';
export * from '@registry/new-york/text-animate/types';
export * from '@registry/new-york/text-string/types';
export * from '@registry/new-york/webgl-liquid/types';

// App-only types that were previously colocated here but are not exported by
// any registry component. They remain owned by the app, not by registry/.

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface DockItem {
  icon: string;
  label: string;
  onClick?: () => void;
}

export interface GeometricShape {
  type: 'circle' | 'triangle' | 'square' | 'diamond';
  size: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

export interface StaggeredEntryOptions {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  duration?: number;
  baseDelay?: number;
  staggerDelay?: number;
}

export interface DocsMobileSheetProps {
  title?: string;
}
