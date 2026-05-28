export interface MagneticDockItemData {
  icon: string;
  label: string;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export type MagneticDockVariant = 'glass' | 'solid' | 'transparent';

export type MagneticDockPosition = 'bottom' | 'top' | 'left' | 'right';
