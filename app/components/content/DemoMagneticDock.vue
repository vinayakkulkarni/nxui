<script setup lang="ts">
  import MagneticDock from '@registry/new-york/MagneticDock/MagneticDock.vue';
  import type {
    MagneticDockItemData,
    MagneticDockVariant,
  } from '~/types/components';

  const defaultItems: MagneticDockItemData[] = [
    { icon: 'lucide:home', label: 'Home', isActive: true },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:mail', label: 'Mail', badge: 3 },
    { icon: 'lucide:music', label: 'Music' },
    { icon: 'lucide:settings', label: 'Settings' },
    { icon: 'lucide:trash', label: 'Trash' },
  ];

  const minimalItems: MagneticDockItemData[] = [
    { icon: 'lucide:home', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];

  const activeTab = ref(0);

  const tabs: {
    label: string;
    variant: MagneticDockVariant;
    items: MagneticDockItemData[];
    iconSize: number;
    maxScale: number;
    magneticDistance: number;
    code: string;
  }[] = [
    {
      label: 'Default',
      variant: 'glass',
      items: defaultItems,
      iconSize: 56,
      maxScale: 1.5,
      magneticDistance: 150,
      code: `\x3Cscript setup lang="ts">
  import MagneticDock from '~/components/ui/MagneticDock/MagneticDock.vue';
  import type { MagneticDockItemData } from '~/types/components';

  const items: MagneticDockItemData[] = [
    { icon: 'lucide:home', label: 'Home', isActive: true },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:mail', label: 'Mail', badge: 3 },
    { icon: 'lucide:music', label: 'Music' },
    { icon: 'lucide:settings', label: 'Settings' },
    { icon: 'lucide:trash', label: 'Trash' },
  ];
\x3C/script>

\x3Ctemplate>
  \x3CMagneticDock :items="items" />
\x3C/template>`,
    },
    {
      label: 'Solid Variant',
      variant: 'solid',
      items: minimalItems,
      iconSize: 56,
      maxScale: 1.5,
      magneticDistance: 150,
      code: `\x3Cscript setup lang="ts">
  import MagneticDock from '~/components/ui/MagneticDock/MagneticDock.vue';

  const items = [
    { icon: 'lucide:home', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];
\x3C/script>

\x3Ctemplate>
  \x3CMagneticDock :items="items" variant="solid" />
\x3C/template>`,
    },
    {
      label: 'Large Scale Effect',
      variant: 'glass',
      items: minimalItems,
      iconSize: 48,
      maxScale: 2,
      magneticDistance: 200,
      code: `\x3Cscript setup lang="ts">
  import MagneticDock from '~/components/ui/MagneticDock/MagneticDock.vue';

  const items = [
    { icon: 'lucide:home', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:folder', label: 'Finder' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];
\x3C/script>

\x3Ctemplate>
  \x3CMagneticDock
    :items="items"
    :icon-size="48"
    :max-scale="2"
    :magnetic-distance="200"
  />
\x3C/template>`,
    },
  ];

  const currentTab = computed(() => tabs[activeTab.value]);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentTab.code" full-width>
    <div
      class="flex min-h-[300px] w-full flex-col items-center justify-end gap-6 pb-8"
    >
      <MagneticDock
        :key="activeTab"
        :items="currentTab.items"
        :variant="currentTab.variant"
        :icon-size="currentTab.iconSize"
        :max-scale="currentTab.maxScale"
        :magnetic-distance="currentTab.magneticDistance"
      />
      <div class="flex gap-2">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.label"
          class="rounded-full px-3 py-1 text-xs transition-colors"
          :class="
            activeTab === index
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          "
          @click="handleTabClick(index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
