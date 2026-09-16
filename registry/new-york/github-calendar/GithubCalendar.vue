<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
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
      /**
       * Overrides the repos shown under the grid. Omit to use the live
       * top-contribution data returned by the proxy.
       */
      topContributions?: GithubTopContribution[];
      /** Render the collapsible "Top contributions in" footer. */
      showTopContributions?: boolean;
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
      showTopContributions: true,
      apiProxy: '/api/github-contributions',
      class: '',
    },
  );

  const loading = ref(true);
  const error = ref<string | null>(null);
  const data = ref<GithubContributionData | null>(null);
  const expanded = ref(false);
  const cardRef = ref<HTMLElement | null>(null);
  /** Width of the card while the grid is visible — held while expanded so the repo list does not collapse the card. */
  const fullWidth = ref(0);

  function toggleExpanded() {
    if (!expanded.value && cardRef.value) {
      fullWidth.value = cardRef.value.offsetWidth;
    }
    expanded.value = !expanded.value;
  }

  /** Prop override wins; otherwise the repos the proxy derived from the API. */
  const EMPTY_TOP_REPOS: GithubTopContribution[] = [];

  const topRepos = computed<GithubTopContribution[]>(
    () =>
      props.topContributions ?? data.value?.topContributions ?? EMPTY_TOP_REPOS,
  );

  function avatarUrl(top: GithubTopContribution): string {
    return `https://github.com/${top.owner ?? props.username}.png?size=64`;
  }

  function repoUrl(top: GithubTopContribution): string {
    return `https://github.com/${top.owner ?? props.username}/${top.repo}`;
  }

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
    <div
      v-else-if="data"
      ref="cardRef"
      :class="
        cn(
          'flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm',
          expanded && fullWidth > 0 && 'w-fit',
        )
      "
      :style="
        expanded && fullWidth > 0 ? { minWidth: `${fullWidth}px` } : undefined
      "
    >
      <!-- Header + grid collapse away while the repo list is open -->
      <AnimatePresence initial="false">
        <component
          :is="motion.div"
          v-if="!expanded"
          key="grid"
          :initial="{ opacity: 0, height: 0 }"
          :animate="{ opacity: 1, height: 'auto' }"
          :exit="{ opacity: 0, height: 0 }"
          :transition="{ type: 'spring', stiffness: 260, damping: 30 }"
          class="flex flex-col gap-2 overflow-hidden"
        >
          <div v-if="showTotal" class="flex items-center justify-between px-1">
            <span class="text-sm font-semibold">
              {{ data.totalContributions }} contributions in the last year
            </span>
            <span class="text-xs text-muted-foreground">@{{ username }}</span>
          </div>

          <GithubCalendarGrid
            :weeks="data.contributions"
            :variant="variant"
            :shape="shape"
            :glow-intensity="glowIntensity"
            :color-schema="colorSchema"
          />
        </component>
      </AnimatePresence>

      <!-- Top contributions -->
      <div
        v-if="showTopContributions && topRepos.length > 0"
        :class="
          cn(
            'flex items-center justify-between gap-3',
            !expanded && 'border-t border-border/50 pt-3',
          )
        "
      >
        <p class="text-sm text-muted-foreground">Top contributions in:</p>

        <div class="flex items-center gap-2">
          <!-- collapsed: stacked avatars -->
          <AnimatePresence initial="false">
            <component
              :is="motion.div"
              v-if="!expanded"
              key="stack"
              :initial="{ opacity: 0, scale: 0.8 }"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0, scale: 0.8 }"
              :transition="{ type: 'spring', stiffness: 340, damping: 26 }"
              class="flex items-center -space-x-2"
            >
              <img
                v-for="top in topRepos"
                :key="top.repo"
                :src="avatarUrl(top)"
                :alt="`${top.owner ?? username}/${top.repo}`"
                class="size-6 rounded-full ring-2 ring-card"
                loading="lazy"
              />
            </component>
          </AnimatePresence>

          <button
            type="button"
            class="flex size-6 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            :aria-expanded="expanded"
            :aria-label="
              expanded ? 'Hide top repositories' : 'Show top repositories'
            "
            @click="toggleExpanded"
          >
            <component
              :is="motion.span"
              :animate="{ rotate: expanded ? 180 : 0 }"
              :transition="{ type: 'spring', stiffness: 320, damping: 24 }"
              class="flex"
            >
              <Icon name="lucide:chevron-down" class="size-3.5" />
            </component>
          </button>
        </div>
      </div>

      <!-- expanded: repo rows -->
      <AnimatePresence initial="false">
        <component
          :is="motion.div"
          v-if="expanded && showTopContributions"
          key="repos"
          :initial="{ opacity: 0, height: 0 }"
          :animate="{ opacity: 1, height: 'auto' }"
          :exit="{ opacity: 0, height: 0 }"
          :transition="{ type: 'spring', stiffness: 260, damping: 30 }"
          class="overflow-hidden"
        >
          <ul class="flex flex-col pt-1">
            <li v-for="(top, i) in topRepos" :key="top.repo">
              <component
                :is="motion.a"
                :href="repoUrl(top)"
                target="_blank"
                rel="noopener noreferrer"
                :initial="{ opacity: 0, y: 8 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{
                  delay: i * 0.05,
                  type: 'spring',
                  stiffness: 320,
                  damping: 26,
                }"
                class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
              >
                <img
                  :src="avatarUrl(top)"
                  :alt="`${top.owner ?? username} avatar`"
                  class="size-7 rounded-full"
                  loading="lazy"
                />
                <span class="flex-1 truncate text-sm">{{ top.repo }}</span>
                <span class="text-sm tabular-nums text-muted-foreground">
                  {{ top.count }}
                </span>
              </component>
            </li>
          </ul>
        </component>
      </AnimatePresence>
    </div>
  </div>
</template>
