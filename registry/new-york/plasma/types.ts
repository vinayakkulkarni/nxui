export type PlasmaDirection = 'forward' | 'reverse' | 'pingpong';

export interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: PlasmaDirection;
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  class?: string;
}
