export interface SplitFlapRow {
  label: string;
  value: string;
}

export interface SplitFlapDisplayProps {
  rows?: SplitFlapRow[];
  text?: string;
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  showIndicators?: boolean;
  staggerDelay?: number;
  flipSpeed?: number;
  class?: string;
}
