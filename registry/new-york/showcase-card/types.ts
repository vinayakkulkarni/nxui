export interface ShowcaseCardProps {
  tagline?: string;
  heading: string;
  description?: string;
  imageUrl: string;
  imageAlt?: string;
  ctaText?: string;
  brandName?: string;
  services?: string[];
  enableTilt?: boolean;
  maxTilt?: number;
  enableParallax?: boolean;
  class?: string;
}

export interface ShowcaseCardCompactProps {
  heading: string;
  description?: string;
  imageUrl: string;
  imageAlt?: string;
  class?: string;
}

export interface ShowcaseCardHorizontalProps {
  tagline?: string;
  heading: string;
  description?: string;
  imageUrl: string;
  imageAlt?: string;
  ctaText?: string;
  brandName?: string;
  services?: string[];
  imagePosition?: 'left' | 'right';
  enableParallax?: boolean;
  class?: string;
}

export interface ShowcaseGridProps {
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  class?: string;
}
