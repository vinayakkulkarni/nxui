<script setup lang="ts">
  import AnimatedGradient from '@registry/new-york/animated-gradient/AnimatedGradient.vue';
  import type { AnimatedGradientConfig } from '~/types/components';

  const activeTab = ref(0);

  const tabs: {
    label: string;
    config: AnimatedGradientConfig;
    code: string;
  }[] = [
    {
      label: 'Aurora',
      config: { preset: 'Aurora' },
      code: `\x3Cscript setup lang="ts">
  import AnimatedGradient from '~/components/ui/AnimatedGradient.vue';
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedGradient :config="{ preset: 'Aurora' }" :noise="{ opacity: 0.2, scale: 1 }" class="h-100" />
\x3C/template>`,
    },
    {
      label: 'Oceanic',
      config: { preset: 'Oceanic' },
      code: `\x3Cscript setup lang="ts">
  import AnimatedGradient from '~/components/ui/AnimatedGradient.vue';
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedGradient :config="{ preset: 'Oceanic' }" :noise="{ opacity: 0.2, scale: 1 }" class="h-100" />
\x3C/template>`,
    },
    {
      label: 'Amber',
      config: { preset: 'Amber' },
      code: `\x3Cscript setup lang="ts">
  import AnimatedGradient from '~/components/ui/AnimatedGradient.vue';
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedGradient :config="{ preset: 'Amber' }" :noise="{ opacity: 0.2, scale: 1 }" class="h-100" />
\x3C/template>`,
    },
    {
      label: 'Toxic',
      config: { preset: 'Toxic' },
      code: `\x3Cscript setup lang="ts">
  import AnimatedGradient from '~/components/ui/AnimatedGradient.vue';
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedGradient :config="{ preset: 'Toxic' }" :noise="{ opacity: 0.2, scale: 1 }" class="h-100" />
\x3C/template>`,
    },
    {
      label: 'Ghost',
      config: { preset: 'Ghost' },
      code: `\x3Cscript setup lang="ts">
  import AnimatedGradient from '~/components/ui/AnimatedGradient.vue';
\x3C/script>

\x3Ctemplate>
  \x3CAnimatedGradient :config="{ preset: 'Ghost' }" :noise="{ opacity: 0.2, scale: 1 }" class="h-100" />
\x3C/template>`,
    },
  ];

  const currentTab = computed(() => tabs[activeTab.value]!);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentTab.code" full-width class="p-0">
    <div class="relative h-100 w-full">
      <ClientOnly>
        <AnimatedGradient
          :key="activeTab"
          :config="currentTab.config"
          :noise="{ opacity: 0.2, scale: 1 }"
          class="h-full min-h-full rounded-lg"
        >
          <div
            class="flex size-full flex-col items-center justify-center pointer-events-none"
          >
            <h2
              class="text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] md:text-7xl"
            >
              Animated
            </h2>
            <h2
              class="mt-2 pb-2 pr-4 text-5xl font-serif italic tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white via-white/90 to-white/40 drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-7xl"
            >
              Gradient
            </h2>
          </div>
        </AnimatedGradient>
        <template #fallback>
          <div
            class="flex h-full w-full items-center justify-center rounded-lg bg-background"
          >
            <span class="text-sm text-white/50">Loading gradient...</span>
          </div>
        </template>
      </ClientOnly>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex gap-2 overflow-x-auto rounded-full"
        >
          <button
            v-for="(tab, index) in tabs"
            :key="tab.label"
            class="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
            :class="
              activeTab === index
                ? 'bg-white text-black dark:bg-white dark:text-black'
                : 'bg-white/20 text-white hover:bg-white/30 dark:bg-white/20 dark:text-white dark:hover:bg-white/30'
            "
            @click="handleTabClick(index)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
