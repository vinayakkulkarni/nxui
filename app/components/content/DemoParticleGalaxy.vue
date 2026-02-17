<script setup lang="ts">
  import ParticleGalaxyRenderer from '@registry/new-york/ParticleGalaxy/ParticleGalaxyRenderer.vue';
  import type { ParticleGalaxyBlendMode } from '~/types/components';

  const colorMode = useColorMode();
  const blendMode = computed<ParticleGalaxyBlendMode>(() =>
    colorMode.value === 'light' ? 'normal' : 'additive',
  );

  const activeTab = ref(0);

  const tabs = [
    {
      label: 'Default',
      props: {},
      code: `\x3Cscript setup lang="ts">
  import ParticleGalaxyRenderer from '~/components/ui/ParticleGalaxy/ParticleGalaxyRenderer.vue';
\x3C/script>

\x3Ctemplate>
  \x3CParticleGalaxyRenderer class="h-[400px] w-full" />
\x3C/template>`,
    },
    {
      label: 'Custom Colors',
      props: {
        colors: ['#10b981', '#06b6d4', '#3b82f6'] as [string, string, string],
        spiralArms: 5,
        particleCount: 15000,
        spread: 3.5,
      },
      code: `<ParticleGalaxyRenderer
  :colors="['#10b981', '#06b6d4', '#3b82f6']"
  :spiral-arms="5"
  :particle-count="15000"
  :spread="3.5"
/>`,
    },
    {
      label: 'Dense & Glowing',
      props: {
        colors: ['#f97316', '#ef4444', '#ec4899'] as [string, string, string],
        particleCount: 20000,
        particleSize: 0.025,
        centerConcentration: 0.8,
        density: 0.9,
        glow: 80,
        spread: 2,
      },
      code: `<ParticleGalaxyRenderer
  :colors="['#f97316', '#ef4444', '#ec4899']"
  :particle-count="20000"
  :particle-size="0.025"
  :center-concentration="0.8"
  :density="0.9"
  :glow="80"
  :spread="2"
/>`,
    },
    {
      label: 'Slow & Interactive',
      props: {
        colors: ['#8b5cf6', '#ec4899', '#f97316'] as [string, string, string],
        rotationSpeed: 0.0005,
        mouseInfluence: 0.8,
        cameraMovement: false,
        pulsate: false,
      },
      code: `<ParticleGalaxyRenderer
  :colors="['#8b5cf6', '#ec4899', '#f97316']"
  :rotation-speed="0.0005"
  :mouse-influence="0.8"
  :camera-movement="false"
  :pulsate="false"
/>`,
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
        <ParticleGalaxyRenderer
          :key="activeTab"
          v-bind="currentTab.props"
          :blend-mode="blendMode"
          class="h-[400px] w-full rounded-lg"
        />
        <template #fallback>
          <div
            class="flex h-[400px] w-full items-center justify-center rounded-lg bg-black"
          >
            <span class="text-sm text-white/50">Loading galaxy...</span>
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
