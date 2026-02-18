export type AnimationType =
  | 'fade-in'
  | 'blur-in'
  | 'blur-in-up'
  | 'blur-in-down'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'scale-down';

export type SplitBy = 'text' | 'word' | 'character';

export type FlightStatus = 'boarding' | 'in-flight' | 'landed' | 'delayed';

export interface AirportInfo {
  city: string;
  code: string;
  time: string;
}

export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: AirportInfo;
  arrival: AirportInfo;
  status: FlightStatus;
  gate?: string;
  progress: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface CommandItem {
  label: string;
  icon?: string;
  shortcut?: string;
  group?: string;
  onSelect?: () => void;
}

export interface DockItem {
  icon: string;
  label: string;
  onClick?: () => void;
}

export interface MagneticDockItemData {
  icon: string;
  label: string;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export interface PixelCanvasPixel {
  x: number;
  y: number;
  size: number;
  intensity: number;
  targetIntensity: number;
  colorPhase: number;
}

export type PixelCanvasVariant = 'default' | 'trail' | 'glow';

export interface GalaxyParticle {
  x: number;
  y: number;
  z: number;
  angle: number;
  radius: number;
  size: number;
  speed: number;
  arm: number;
}

export interface Testimonial {
  name: string;
  text: string;
  avatar: string;
  role?: string;
  username?: string;
  profileLink?: string;
}

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

export interface GeometricShape {
  type: 'circle' | 'triangle' | 'square' | 'diamond';
  size: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

export type MagneticDockVariant = 'glass' | 'solid' | 'transparent';
export type MagneticDockPosition = 'bottom' | 'top' | 'left' | 'right';

export interface CollectionSurferItem {
  id: number;
  image: string;
  title: string;
}

export type CollectionSurferVariant = 'magnetic' | 'uplift' | 'simple';

export interface SocialProvider {
  icon: string;
  label: string;
}

export interface StaggeredEntryOptions {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  duration?: number;
  baseDelay?: number;
  staggerDelay?: number;
}

export interface FlightStatusCardProps {
  departureCode?: string;
  arrivalCode?: string;
  departureCity?: string;
  arrivalCity?: string;
  departureTime?: string;
  arrivalTime?: string;
  eta?: string;
  timezone?: string;
  nextEvent?: string;
  nextEventTime?: string;
  progress?: number;
  remainingTime?: string;
  class?: string;
}

export interface NodeDiagramNodeData {
  id: string;
  x: number;
  y: number;
  label: string;
  icon?: string;
  status?: 'idle' | 'active' | 'processing' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export interface NodeDiagramConnectionData {
  from: string;
  to: string;
  animated?: boolean;
  bidirectional?: boolean;
  color?: string;
  pulseColor?: string;
}

export interface GithubContributionDay {
  color: string;
  contributionCount: number;
  contributionLevel:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';
  date: string;
}

export interface GithubContributionData {
  contributions: GithubContributionDay[][];
  totalContributions: number;
}

export type GithubCalendarColorSchema =
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'gray';

export type GithubCalendarVariant = 'default' | 'city-lights' | 'minimal';

export type GithubCalendarShape = 'square' | 'rounded' | 'circle' | 'squircle';

export interface HeroGeometricProps {
  title1?: string;
  title2?: string;
  description?: string;
  color1?: string;
  color2?: string;
  speed?: number;
  class?: string;
}

export interface DitherPrismHeroProps {
  title1?: string;
  title2?: string;
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  ditherIntensity?: number;
  prismIntensity?: number;
  particleCount?: number;
  showParticles?: boolean;
  particleColor?: string;
  class?: string;
}

export interface WebGLLiquidProps {
  title?: string;
  subtitle?: string;
  description?: string;
  colorDeep?: string;
  colorMid?: string;
  colorHighlight?: string;
  speed?: number;
  flowStrength?: number;
  grain?: number;
  contrast?: number;
  opacity?: number;
  reveal?: boolean;
  delayMs?: number;
  revealDuration?: number;
  class?: string;
}

export interface ClosingPlasmaProps {
  speed?: number;
  turbulence?: number;
  mouseInfluence?: number;
  grain?: number;
  sparkle?: number;
  vignette?: number;
  opacity?: number;
  interactive?: boolean;
  darkColorA?: string;
  darkColorB?: string;
  darkColorC?: string;
  lightColorA?: string;
  lightColorB?: string;
  lightColorC?: string;
  class?: string;
}

export type ParticleGalaxyBlendMode = 'additive' | 'normal';

export interface GlassIconItem {
  icon: string;
  label: string;
  color?: string;
  customClass?: string;
}

export interface StackAnimationConfig {
  stiffness: number;
  damping: number;
}
