export type SplitMode = 'words' | 'characters' | 'lines';
export type RevealDirection = 'up' | 'down' | 'left' | 'right';
export type StaggerOrigin =
  | 'start'
  | 'end'
  | 'center'
  | 'edges'
  | 'random'
  | number;

export interface KineticTextRevealRef {
  play: () => void;
  reset: () => void;
}

export interface Segment {
  value: string;
  animated: boolean;
  index: number;
}
