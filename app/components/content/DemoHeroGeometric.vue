<script setup lang="ts">
  import HeroGeometric from '@registry/new-york/HeroGeometric/HeroGeometric.vue';

  const activeTab = ref(0);

  const tabs = [
    {
      label: 'Default',
      props: { title1: 'Elevate', title2: 'Your Brand' },
      code: `\x3Cscript setup lang="ts">
  import HeroGeometric from '~/components/ui/HeroGeometric.vue';
\x3C/script>

\x3Ctemplate>
  \x3CHeroGeometric title1="Elevate" title2="Your Brand" />
\x3C/template>`,
    },
    {
      label: 'Warm Palette',
      props: {
        color1: '#EA580C',
        color2: '#FFF7ED',
        title1: 'Warm',
        title2: 'Palette',
      },
      code: `\x3Cscript setup lang="ts">
  import HeroGeometric from '~/components/ui/HeroGeometric.vue';
\x3C/script>

\x3Ctemplate>
  \x3CHeroGeometric color1="#EA580C" color2="#FFF7ED" title1="Warm" title2="Palette" />
\x3C/template>`,
    },
    {
      label: 'High Velocity',
      props: { speed: 2, title1: 'High', title2: 'Velocity' },
      code: `\x3Cscript setup lang="ts">
  import HeroGeometric from '~/components/ui/HeroGeometric.vue';
\x3C/script>

\x3Ctemplate>
  \x3CHeroGeometric :speed="2" title1="High" title2="Velocity" />
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
    <div class="relative h-[500px] w-full overflow-hidden">
      <ClientOnly>
        <HeroGeometric
          :key="activeTab"
          v-bind="currentTab.props"
          class="h-full"
        />
        <template #fallback>
          <div
            class="flex h-full w-full items-center justify-center bg-blue-50"
          >
            <span class="text-sm text-blue-400">Loading hero...</span>
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
              ? 'bg-zinc-900 text-white'
              : 'bg-white/60 text-zinc-700 hover:bg-white/80'
          "
          @click="handleTabClick(index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
