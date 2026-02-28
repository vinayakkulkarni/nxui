<script setup lang="ts">
  import DitherPrismHero from '@registry/new-york/DitherPrismHero/DitherPrismHero.vue';

  const activeTab = ref(0);

  const tabs = [
    {
      label: 'Default',
      props: { title1: 'Experience', title2: 'The Future' },
      code: `\x3Cscript setup lang="ts">
  import DitherPrismHero from '~/components/ui/DitherPrismHero.vue';
\x3C/script>

\x3Ctemplate>
  \x3CDitherPrismHero title1="Experience" title2="The Future" />
\x3C/template>`,
    },
    {
      label: 'Cyberpunk',
      props: {
        color1: '#0a0a0a',
        color2: '#00ff88',
        color3: '#00ffff',
        title1: 'Cyber',
        title2: 'Punk',
        ditherIntensity: 0.25,
        prismIntensity: 0.7,
      },
      code: `\x3Cscript setup lang="ts">
  import DitherPrismHero from '~/components/ui/DitherPrismHero.vue';
\x3C/script>

\x3Ctemplate>
  \x3CDitherPrismHero color1="#0a0a0a" color2="#00ff88" color3="#00ffff" title1="Cyber" title2="Punk" :dither-intensity="0.25" :prism-intensity="0.7" />
\x3C/template>`,
    },
    {
      label: 'Sunset',
      props: {
        color1: '#1a0a0a',
        color2: '#ff6b35',
        color3: '#ffd93d',
        title1: 'Golden',
        title2: 'Hour',
        ditherIntensity: 0.12,
        prismIntensity: 0.4,
      },
      code: `\x3Cscript setup lang="ts">
  import DitherPrismHero from '~/components/ui/DitherPrismHero.vue';
\x3C/script>

\x3Ctemplate>
  \x3CDitherPrismHero color1="#1a0a0a" color2="#ff6b35" color3="#ffd93d" title1="Golden" title2="Hour" :dither-intensity="0.12" :prism-intensity="0.4" />
\x3C/template>`,
    },
    {
      label: 'Ocean',
      props: {
        color1: '#0a1628',
        color2: '#0ea5e9',
        color3: '#22d3ee',
        title1: 'Deep',
        title2: 'Ocean',
        speed: 0.7,
        showParticles: true,
        particleCount: 100,
      },
      code: `\x3Cscript setup lang="ts">
  import DitherPrismHero from '~/components/ui/DitherPrismHero.vue';
\x3C/script>

\x3Ctemplate>
  \x3CDitherPrismHero color1="#0a1628" color2="#0ea5e9" color3="#22d3ee" title1="Deep" title2="Ocean" :speed="0.7" :particle-count="100" />
\x3C/template>`,
    },
    {
      label: 'Maximum Impact',
      props: {
        ditherIntensity: 0.3,
        prismIntensity: 0.9,
        speed: 1.5,
        title1: 'Maximum',
        title2: 'Impact',
      },
      code: `\x3Cscript setup lang="ts">
  import DitherPrismHero from '~/components/ui/DitherPrismHero.vue';
\x3C/script>

\x3Ctemplate>
  \x3CDitherPrismHero :dither-intensity="0.3" :prism-intensity="0.9" :speed="1.5" title1="Maximum" title2="Impact" />
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
    <div class="relative h-125 w-full">
      <ClientOnly>
        <DitherPrismHero
          :key="activeTab"
          v-bind="currentTab.props"
          class="h-full"
        />
        <template #fallback>
          <div
            class="flex h-full w-full items-center justify-center bg-[#0f0f23]"
          >
            <span class="text-sm text-foreground/50"
              >Loading dither prism...</span
            >
          </div>
        </template>
      </ClientOnly>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex flex-wrap justify-center gap-2"
      >
        <button
          v-for="(tab, index) in tabs"
          :key="tab.label"
          class="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
          :class="
            activeTab === index
              ? 'bg-white text-black'
              : 'bg-white/20 text-white hover:bg-white/30'
          "
          @click="handleTabClick(index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
