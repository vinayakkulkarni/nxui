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

export type NodeDiagramPattern = 'data-flow' | 'network' | 'processor' | 'tree';
