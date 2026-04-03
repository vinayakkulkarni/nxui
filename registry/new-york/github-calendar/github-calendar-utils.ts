import type { GithubCalendarColorSchema } from '~/types/components';

export const colorSchemas: Record<
  GithubCalendarColorSchema,
  {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  }
> = {
  gray: {
    level0: 'bg-zinc-100 dark:bg-zinc-900',
    level1: 'bg-zinc-300 dark:bg-zinc-800',
    level2: 'bg-zinc-400 dark:bg-zinc-700',
    level3: 'bg-zinc-600 dark:bg-zinc-500',
    level4: 'bg-zinc-800 dark:bg-zinc-300',
  },
  green: {
    level0: 'bg-zinc-100 dark:bg-zinc-900',
    level1: 'bg-emerald-200 dark:bg-emerald-900',
    level2: 'bg-emerald-300 dark:bg-emerald-700',
    level3: 'bg-emerald-400 dark:bg-emerald-500',
    level4: 'bg-emerald-500 dark:bg-emerald-400',
  },
  blue: {
    level0: 'bg-zinc-100 dark:bg-zinc-900',
    level1: 'bg-blue-200 dark:bg-blue-900',
    level2: 'bg-blue-300 dark:bg-blue-700',
    level3: 'bg-blue-400 dark:bg-blue-500',
    level4: 'bg-blue-500 dark:bg-blue-400',
  },
  purple: {
    level0: 'bg-zinc-100 dark:bg-zinc-900',
    level1: 'bg-purple-200 dark:bg-purple-900',
    level2: 'bg-purple-300 dark:bg-purple-700',
    level3: 'bg-purple-400 dark:bg-purple-500',
    level4: 'bg-purple-500 dark:bg-purple-400',
  },
  orange: {
    level0: 'bg-zinc-100 dark:bg-zinc-900',
    level1: 'bg-orange-200 dark:bg-orange-900',
    level2: 'bg-orange-300 dark:bg-orange-700',
    level3: 'bg-orange-400 dark:bg-orange-500',
    level4: 'bg-orange-500 dark:bg-orange-400',
  },
};

const glowColorMap: Record<GithubCalendarColorSchema, string> = {
  green: '#10b981',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  gray: '#71717a',
};

export function getLevelClass(
  level: string,
  schema: GithubCalendarColorSchema = 'green',
) {
  const s = colorSchemas[schema];
  switch (level) {
    case 'FIRST_QUARTILE':
      return s.level1;
    case 'SECOND_QUARTILE':
      return s.level2;
    case 'THIRD_QUARTILE':
      return s.level3;
    case 'FOURTH_QUARTILE':
      return s.level4;
    default:
      return s.level0;
  }
}

export function getShapeClass(shape: string) {
  switch (shape) {
    case 'circle':
      return 'rounded-full';
    case 'square':
      return 'rounded-none';
    case 'squircle':
      return 'rounded-sm';
    default:
      return 'rounded-[2px]';
  }
}

export function getGlowColor(schema: GithubCalendarColorSchema) {
  return glowColorMap[schema];
}
