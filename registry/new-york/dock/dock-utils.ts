import type {
  DockItemData,
  DockMenuItem,
  DockSide,
  DockSpring,
  DockTheme,
  DockTokens,
} from './types';

export const DOCK_SIDES: DockSide[] = ['bottom', 'top', 'left', 'right'];
export const DOCK_EDGE = 12;
export const DOCK_HOP = 0.4;
export const DOCK_HOP_TIME = 0.38;
export const DOCK_HOLD_TIME = 450;
export const DOCK_TAIL = 9;
export const DOCK_TAIL_HALF = 9;
export const DOCK_MENU_RADIUS = 10;
export const DOCK_MENU_GAP = 8;
export const DOCK_MARGIN = 8;
export const DOCK_POP = 'cubic-bezier(0.2, 1.25, 0.4, 1)';

export const DOCK_DEFAULT_SPRING: Required<DockSpring> = {
  mass: 0.1,
  stiffness: 150,
  damping: 12,
};

export const DOCK_NO_ROWS: DockMenuItem[] = [];

export const DOCK_THEMES: Record<DockTheme, DockTokens> = {
  dark: {
    '--dock-panel': 'rgba(38, 35, 46, 0.66)',
    '--dock-panel-edge': 'rgba(255, 255, 255, 0.08)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.07)',
    '--dock-panel-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--dock-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--dock-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--dock-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--dock-ink': '#f4f4f5',
    '--dock-label': '#2a2731',
    '--dock-label-ink': '#f4f4f5',
    '--dock-dot': 'rgba(255, 255, 255, 0.72)',
    '--dock-separator': 'rgba(255, 255, 255, 0.12)',
    '--dock-press': 'brightness(0.75)',
    '--dock-menu': 'rgba(40, 37, 47, 0.8)',
    '--dock-menu-edge': 'rgba(255, 255, 255, 0.13)',
    '--dock-menu-ink': '#f4f4f5',
    '--dock-menu-muted': 'rgba(244, 244, 245, 0.42)',
    '--dock-menu-separator': 'rgba(255, 255, 255, 0.1)',
    '--dock-menu-shadow':
      '0 18px 40px -12px rgba(0, 0, 0, 0.65), 0 3px 10px rgba(0, 0, 0, 0.3)',
  },
  light: {
    '--dock-panel': 'rgba(240, 240, 243, 0.8)',
    '--dock-panel-edge': 'rgba(24, 24, 27, 0.07)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.95)',
    '--dock-panel-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--dock-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--dock-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--dock-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--dock-ink': '#27272a',
    '--dock-label': '#ffffff',
    '--dock-label-ink': '#18181b',
    '--dock-dot': 'rgba(24, 24, 27, 0.55)',
    '--dock-separator': 'rgba(24, 24, 27, 0.12)',
    '--dock-press': 'brightness(0.9)',
    '--dock-menu': 'rgba(248, 248, 250, 0.86)',
    '--dock-menu-edge': 'rgba(24, 24, 27, 0.1)',
    '--dock-menu-ink': '#18181b',
    '--dock-menu-muted': 'rgba(24, 24, 27, 0.4)',
    '--dock-menu-separator': 'rgba(24, 24, 27, 0.1)',
    '--dock-menu-shadow':
      '0 18px 40px -14px rgba(24, 24, 27, 0.3), 0 3px 10px rgba(24, 24, 27, 0.1)',
  },
};

export function hasBadge(badge: DockItemData['badge']): boolean {
  return badge !== undefined && badge !== null && badge !== false;
}

export function usable(row?: DockMenuItem | null): row is DockMenuItem {
  return !!row && !row.separator && !row.disabled;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
}

/** Outline of a menu bubble with an optional tail pointing at the dock. */
export function menuPath(
  width: number,
  height: number,
  side: DockSide | null,
  at: number,
): string {
  const r = DOCK_MENU_RADIUS;
  const p = (x: number, y: number) =>
    `${(x + DOCK_TAIL).toFixed(2)} ${(y + DOCK_TAIL).toFixed(2)}`;
  const tail = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    nx: number,
    ny: number,
  ) => {
    const q = (u: number, v: number) =>
      p(x + dx * u + nx * v, y + dy * u + ny * v);
    return `L ${q(-DOCK_TAIL_HALF, 0)} L ${q(-DOCK_TAIL_HALF * 0.18, DOCK_TAIL * 0.82)} Q ${q(0, DOCK_TAIL)} ${q(DOCK_TAIL_HALF * 0.18, DOCK_TAIL * 0.82)} L ${q(DOCK_TAIL_HALF, 0)}`;
  };
  return [
    `M ${p(r, 0)}`,
    side === 'top' ? tail(at, 0, 1, 0, 0, -1) : '',
    `L ${p(width - r, 0)} A ${r} ${r} 0 0 1 ${p(width, r)}`,
    side === 'right' ? tail(width, at, 0, 1, 1, 0) : '',
    `L ${p(width, height - r)} A ${r} ${r} 0 0 1 ${p(width - r, height)}`,
    side === 'bottom' ? tail(at, height, -1, 0, 0, 1) : '',
    `L ${p(r, height)} A ${r} ${r} 0 0 1 ${p(0, height - r)}`,
    side === 'left' ? tail(0, at, 0, -1, -1, 0) : '',
    `L ${p(0, r)} A ${r} ${r} 0 0 1 ${p(r, 0)} Z`,
  ].join(' ');
}
