import type { UserDropdownBadgeTone } from './types';

const BADGE_TONES: Record<UserDropdownBadgeTone, string> = {
  success:
    'border border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  accent: 'bg-orange-600 text-white dark:bg-orange-500',
  neutral: 'border border-border bg-muted text-muted-foreground',
};

export function badgeClass(tone: UserDropdownBadgeTone = 'neutral'): string {
  return BADGE_TONES[tone];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export const SUBMENU_WIDTH = 232;
export const SUBMENU_GAP = 8;
