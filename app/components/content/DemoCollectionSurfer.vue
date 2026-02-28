<script setup lang="ts">
  import CollectionSurfer from '@registry/new-york/CollectionSurfer/CollectionSurfer.vue';
  import type {
    CollectionSurferItem,
    CollectionSurferVariant,
  } from '~/types/components';

  const items: CollectionSurferItem[] = [
    {
      id: 1,
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      title: 'HERITAGE 01',
    },
    {
      id: 2,
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      title: 'HERITAGE 02',
    },
    {
      id: 3,
      image:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
      title: 'HERITAGE 03',
    },
    {
      id: 4,
      image:
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
      title: 'HERITAGE 04',
    },
    {
      id: 5,
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
      title: 'HERITAGE 05',
    },
    {
      id: 6,
      image:
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
      title: 'HERITAGE 06',
    },
    {
      id: 7,
      image:
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
      title: 'HERITAGE 07',
    },
    {
      id: 8,
      image:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
      title: 'HERITAGE 08',
    },
  ];

  const activeTab = ref(0);

  const variants: {
    label: string;
    variant: CollectionSurferVariant;
    code: string;
  }[] = [
    {
      label: 'Magnetic',
      variant: 'magnetic',
      code: `\x3Cscript setup lang="ts">
  import CollectionSurfer from '~/components/ui/CollectionSurfer.vue';
  import type { CollectionSurferItem } from '~/types/components';

  const items: CollectionSurferItem[] = [
    { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', title: 'HERITAGE 01' },
    { id: 2, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', title: 'HERITAGE 02' },
    // ...
  ];
\x3C/script>

\x3Ctemplate>
  \x3CCollectionSurfer :items="items" variant="magnetic" class="h-150" />
\x3C/template>`,
    },
    {
      label: 'Uplift',
      variant: 'uplift',
      code: `\x3Cscript setup lang="ts">
  import CollectionSurfer from '~/components/ui/CollectionSurfer.vue';
  import type { CollectionSurferItem } from '~/types/components';

  const items: CollectionSurferItem[] = [
    { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', title: 'HERITAGE 01' },
    // ...
  ];
\x3C/script>

\x3Ctemplate>
  \x3CCollectionSurfer :items="items" variant="uplift" class="h-150" />
\x3C/template>`,
    },
    {
      label: 'Simple',
      variant: 'simple',
      code: `\x3Cscript setup lang="ts">
  import CollectionSurfer from '~/components/ui/CollectionSurfer.vue';
  import type { CollectionSurferItem } from '~/types/components';

  const items: CollectionSurferItem[] = [
    { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', title: 'HERITAGE 01' },
    // ...
  ];
\x3C/script>

\x3Ctemplate>
  \x3CCollectionSurfer :items="items" variant="simple" class="h-150" />
\x3C/template>`,
    },
  ];

  const currentVariant = computed(() => variants[activeTab.value]!);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentVariant.code" full-width>
    <div class="relative h-150 w-full">
      <CollectionSurfer
        :key="currentVariant.variant"
        :items="items"
        :variant="currentVariant.variant"
        class="h-full rounded-lg"
      />
      <!-- Tabs overlaid at bottom of the component -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2"
      >
        <button
          v-for="(variant, index) in variants"
          :key="variant.label"
          class="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
          :class="
            activeTab === index
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'bg-black/10 text-neutral-700 hover:bg-black/20 dark:bg-white/20 dark:text-white dark:hover:bg-white/30'
          "
          @click="handleTabClick(index)"
        >
          {{ variant.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
