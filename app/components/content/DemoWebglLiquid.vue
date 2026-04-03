<script setup lang="ts">
  import WebGLLiquid from '@registry/new-york/webgl-liquid/WebGLLiquid.vue';

  const activeTab = ref(0);

  const tabs = [
    {
      label: 'Default',
      props: {},
      code: `\x3Cscript setup lang="ts">
  import WebGLLiquid from '~/components/ui/WebGLLiquid.vue';
\x3C/script>

\x3Ctemplate>
  \x3CWebGLLiquid title="Fluid Motion" subtitle="Premium Presence" />
\x3C/template>`,
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
      code: `\x3Cscript setup lang="ts">
  import WebGLLiquid from '~/components/ui/WebGLLiquid.vue';
\x3C/script>

\x3Ctemplate>
  \x3CWebGLLiquid color-deep="#020b06" color-mid="#065f46" color-highlight="#6ee7b7" title="Emerald" subtitle="Flow" />
\x3C/template>`,
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
      code: `\x3Cscript setup lang="ts">
  import WebGLLiquid from '~/components/ui/WebGLLiquid.vue';
\x3C/script>

\x3Ctemplate>
  \x3CWebGLLiquid color-deep="#1a0505" color-mid="#c2410c" color-highlight="#fbbf24" title="Warm" subtitle="Glow" />
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
        <WebGLLiquid
          :key="activeTab"
          v-bind="currentTab.props"
          class="h-full"
        />
        <template #fallback>
          <div
            class="flex h-full w-full items-center justify-center bg-[#02040b]"
          >
            <span class="text-sm text-foreground/50">Loading liquid...</span>
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
                ? 'bg-white text-black'
                : 'bg-white/20 text-white hover:bg-white/30'
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
