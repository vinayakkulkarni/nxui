export interface DockSpringConfig {
  mass?: number;
  stiffness?: number;
  damping?: number;
}

export interface DockItemData {
  icon?: string;
  label?: string;
  onClick?: () => void;
  class?: string;
}
