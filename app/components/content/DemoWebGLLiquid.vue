<script setup lang="ts">
import WebGLLiquid from '@registry/new-york/WebGLLiquid/WebGLLiquid.vue';

const activeTab = ref(0);

const tabs = [
  {
    label: 'Default',
    props: {},
    code: `<WebGLLiquid title="Fluid Motion" subtitle="Premium Presence" />`,
  },
  {
    label: 'Emerald',
    props: {
      colorDeep: '#020b06',
      colorMid: '#065f46',
      colorHighlight: '#6ee7b7',
      title: 'Emerald',
      subtitle: 'Flow',
    },
    code: `<WebGLLiquid colorDeep="#020b06" colorMid="#065f46" colorHighlight="#6ee7b7" title="Emerald" subtitle="Flow" />`,
  },
  {
    label: 'Sunset',
    props: {
      colorDeep: '#1a0505',
      colorMid: '#c2410c',
      colorHighlight: '#fbbf24',
      title: 'Warm',
      subtitle: 'Glow',
    },
    code: `<WebGLLiquid colorDeep="#1a0505" colorMid="#c2410c" colorHighlight="#fbbf24" title="Warm" subtitle="Glow" />`,
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
        <WebGLLiquid
          :key="activeTab"
          v-bind="currentTab.props"
          class="min-h-[500px]"
        />
        <template #fallback>
          <div class="flex min-h-[500px] w-full items-center justify-center bg-[#02040b]">
            <span class="text-sm text-white/50">Loading liquid...</span>
          </div>
        </template>
      </ClientOnly>
      <div class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2">
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
