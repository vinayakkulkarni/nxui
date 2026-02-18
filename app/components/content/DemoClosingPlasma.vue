<script setup lang="ts">
  import ClosingPlasma from '@registry/new-york/ClosingPlasma/ClosingPlasma.vue';

  const activeTab = ref(0);

  const tabs = [
    {
      label: 'Default',
      props: {},
      code: `\x3Cscript setup lang="ts">
  import ClosingPlasma from '~/components/ui/ClosingPlasma.vue';
\x3C/script>

\x3Ctemplate>
  \x3CClosingPlasma class="h-[400px]" />
\x3C/template>`,
    },
    {
      label: 'Custom Colors',
      props: {
        darkColorA: '#0a0a1e',
        darkColorB: '#1a1a4e',
        darkColorC: '#6366f1',
      },
      code: `\x3Cscript setup lang="ts">
  import ClosingPlasma from '~/components/ui/ClosingPlasma.vue';
\x3C/script>

\x3Ctemplate>
  \x3CClosingPlasma dark-color-a="#0a0a1e" dark-color-b="#1a1a4e" dark-color-c="#6366f1" class="h-[400px]" />
\x3C/template>`,
    },
    {
      label: 'High Turbulence',
      props: { turbulence: 2, speed: 1.5 },
      code: `\x3Cscript setup lang="ts">
  import ClosingPlasma from '~/components/ui/ClosingPlasma.vue';
\x3C/script>

\x3Ctemplate>
  \x3CClosingPlasma :turbulence="2" :speed="1.5" class="h-[400px]" />
\x3C/template>`,
    },
  ];

  const currentTab = computed(() => tabs[activeTab.value]);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentTab.code" full-width class="p-0">
    <div class="relative w-full">
      <ClientOnly>
        <ClosingPlasma
          :key="activeTab"
          v-bind="currentTab.props"
          class="h-[400px] rounded-lg"
        >
          <div class="flex size-full items-center justify-center">
            <p class="text-lg font-semibold text-white/80 dark:text-white/80">
              Premium Footer Section
            </p>
          </div>
        </ClosingPlasma>
        <template #fallback>
          <div
            class="flex h-[400px] w-full items-center justify-center rounded-lg bg-zinc-900"
          >
            <span class="text-sm text-white/50">Loading plasma...</span>
          </div>
        </template>
      </ClientOnly>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2"
      >
        <button
          v-for="(tab, index) in tabs"
          :key="tab.label"
          class="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
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
  </ComponentDemo>
</template>
