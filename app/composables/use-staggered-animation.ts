import type { StaggeredEntryOptions } from '~/types/components';

export function useStaggeredAnimation(options?: StaggeredEntryOptions) {
  const {
    initial = { opacity: 0, y: 20 },
    animate = { opacity: 1, y: 0 },
    duration = 0.3,
    baseDelay = 0.1,
    staggerDelay = 0.05,
  } = options ?? {};

  function staggeredEntry(index: number) {
    return {
      initial,
      animate,
      transition: { duration, delay: baseDelay + index * staggerDelay },
    };
  }

  return { staggeredEntry };
}
