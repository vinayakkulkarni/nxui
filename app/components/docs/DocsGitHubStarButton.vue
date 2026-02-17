<script setup lang="ts">
  const stars = useLocalStorage<number | null>('github-stars-count', null);
  const cacheTimestamp = useLocalStorage<number>('github-stars-ts', 0);

  const CACHE_TTL = 15 * 60 * 1000;

  onMounted(async () => {
    const isFresh = Date.now() - cacheTimestamp.value < CACHE_TTL;
    if (stars.value !== null && isFresh) return;

    try {
      const res = await fetch(
        'https://api.github.com/repos/vinayakkulkarni/nxui',
      );
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.stargazers_count === 'number') {
        stars.value = data.stargazers_count;
        cacheTimestamp.value = Date.now();
      }
    } catch {
      // keep stale cache on failure
    }
  });
</script>

<template>
  <NuxtLink
    to="https://github.com/vinayakkulkarni/nxui"
    target="_blank"
    class="group relative inline-flex h-9 items-center gap-2 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.03] px-3 text-sm text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-yellow-500/20 hover:bg-yellow-500/[0.08] hover:text-foreground hover:shadow-[0_0_20px_rgba(234,179,8,0.08)]"
  >
    <div class="flex items-center gap-2">
      <Icon
        name="lucide:star"
        class="size-4 text-yellow-500 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110"
      />
      <span class="font-medium">Star</span>
    </div>
    <template v-if="stars !== null">
      <div class="h-4 w-px bg-yellow-500/15"></div>
      <span
        class="font-mono text-xs opacity-70 transition-opacity group-hover:opacity-100"
      >
        {{ stars.toLocaleString() }}
      </span>
    </template>
  </NuxtLink>
</template>
