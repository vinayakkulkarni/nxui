<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { motion } from 'motion-v';
  import type {
    GithubContributionData,
    GithubCalendarColorSchema,
    GithubCalendarVariant,
    GithubCalendarShape,
    GithubTopContribution,
  } from './types';
  import { cn } from '~/lib/utils';
  import GithubCalendarGrid from './GithubCalendarGrid.vue';
  import { isFlatContributionData, toWeeks } from './github-calendar-utils';

  const GITHUB_API_URL = 'https://github-contributions-api.jogruber.de/v4';

  const props = withDefaults(
    defineProps<{
      username: string;
      variant?: GithubCalendarVariant;
      shape?: GithubCalendarShape;
      glowIntensity?: number;
      showTotal?: boolean;
      colorSchema?: GithubCalendarColorSchema;
      /** Optional "Top contributions in" repos shown under the grid. */
      topContributions?: GithubTopContribution[];
      /**
       * Same-origin proxy endpoint (`/api/...`) tried first — the public API
       * sends no CORS headers, so direct browser calls can fail.
       */
      apiProxy?: string;
      class?: string;
    }>(),
    {
      variant: 'default',
      shape: 'rounded',
      glowIntensity: 5,
      showTotal: true,
      colorSchema: 'green',
      topContributions: undefined,
      apiProxy: '/api/github-contributions',
      class: '',
    },
  );

  const loading = ref(true);
  const error = ref<string | null>(null);
  const data = ref<GithubContributionData | null>(null);

  async function fetchJson(url: string): Promise<GithubContributionData> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch contributions for @${props.username}`);
    }
    const json: unknown = await response.json();
    if (isFlatContributionData(json)) return toWeeks(json);
    return json as GithubContributionData;
  }

  onMounted(async () => {
    const sources = [
      ...(props.apiProxy ? [`${props.apiProxy}/${props.username}`] : []),
      `${GITHUB_API_URL}/${props.username}?y=last`,
    ];
    for (const url of sources) {
      try {
        data.value = await fetchJson(url);
        error.value = null;
        break;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'An unknown error occurred';
      }
    }
    loading.value = false;
  });
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="w-full h-32 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl"
    ></div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 text-red-500 text-sm"
    >
      Error: {{ error }}
    </div>

    <!-- Data loaded -->
    <div v-else-if="data" class="flex flex-col gap-2">
      <!-- Header -->
      <div v-if="showTotal" class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <svg
            height="16"
            viewBox="0 0 16 16"
            width="16"
            class="fill-current text-muted-foreground"
          >
            <path
              d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
            />
          </svg>
          <span class="font-semibold text-sm">@{{ username }}</span>
        </div>
        <span class="text-sm text-muted-foreground">
          {{ data.totalContributions }} contributions in the last year
        </span>
      </div>

      <!-- Grid -->
      <GithubCalendarGrid
        :weeks="data.contributions"
        :variant="variant"
        :shape="shape"
        :glow-intensity="glowIntensity"
        :color-schema="colorSchema"
      />

      <!-- Top contributions -->
      <div
        v-if="topContributions && topContributions.length > 0"
        class="mt-4 border-t border-border/50 pt-4"
      >
        <p class="text-xs font-medium text-muted-foreground">
          Top contributions in:
        </p>
        <div class="mt-2.5 flex flex-wrap gap-2">
          <component
            :is="motion.div"
            v-for="(top, i) in topContributions"
            :key="top.repo"
            :initial="{ opacity: 0, y: 12, scale: 0.9 }"
            :animate="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{
              delay: 0.1 + i * 0.07,
              type: 'spring',
              stiffness: 300,
              damping: 24,
            }"
            class="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1.5 pl-2 pr-3 text-xs dark:border-white/6"
          >
            <span class="text-sm leading-none">{{ top.emoji ?? '🐙' }}</span>
            <span class="font-medium">{{ top.repo }}</span>
            <span class="tabular-nums text-muted-foreground">{{
              top.count
            }}</span>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>
