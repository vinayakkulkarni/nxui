export interface EditorialOrbsProps {
  text?: string;
  orbCount?: number;
  showDropCap?: boolean;
  showPullQuotes?: boolean;
  className?: string;
}

export interface EditorialOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  glow: string;
  active: boolean;
}

export interface EditorialOrbsTextSpan {
  word: string;
  x: number;
  y: number;
  width: number;
  isDropCap: boolean;
}

export interface EditorialOrbsPullQuote {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}
