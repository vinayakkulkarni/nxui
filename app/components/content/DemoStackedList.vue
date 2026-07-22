<script setup lang="ts">
  import StackedList from '@registry/new-york/stacked-list/StackedList.vue';
  import type { StackedListItem } from '@registry/new-york/stacked-list/types';

  const items: StackedListItem[] = [
    {
      eyebrow: 'Feb 2, 2025',
      title: 'Wildflower Fields',
      image: 'https://picsum.photos/seed/wildflower/96/96',
    },
    {
      eyebrow: 'Mar 14, 2025',
      title: 'Storm Rider',
      image: 'https://picsum.photos/seed/storm/96/96',
    },
    {
      eyebrow: 'Apr 5, 2025',
      title: 'Golden Hour',
      image: 'https://picsum.photos/seed/golden/96/96',
    },
    {
      eyebrow: 'May 1, 2025',
      title: 'Cap Study',
      image: 'https://picsum.photos/seed/cap/96/96',
    },
    {
      eyebrow: 'May 20, 2025',
      title: 'Abstract Series',
      image: 'https://picsum.photos/seed/abstract/96/96',
    },
    {
      eyebrow: 'Jun 3, 2025',
      title: 'Lens Study',
      image: 'https://picsum.photos/seed/lens/96/96',
    },
    {
      eyebrow: 'Jul 8, 2025',
      title: 'Red Poppy',
      image: 'https://picsum.photos/seed/poppy/96/96',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StackedList from '~/components/ui/stacked-list/StackedList.vue';
  import type { StackedListItem } from '~/components/ui/stacked-list/types';

  const items: StackedListItem[] = [
    { eyebrow: 'Feb 2, 2025', title: 'Wildflower Fields', image: '/img/1.jpg' },
    { eyebrow: 'Mar 14, 2025', title: 'Storm Rider', image: '/img/2.jpg' },
    { eyebrow: 'Apr 5, 2025', title: 'Golden Hour', image: '/img/3.jpg' },
    { eyebrow: 'May 1, 2025', title: 'Cap Study', image: '/img/4.jpg' },
    { eyebrow: 'May 20, 2025', title: 'Abstract Series', image: '/img/5.jpg' },
    { eyebrow: 'Jun 3, 2025', title: 'Lens Study', image: '/img/6.jpg' },
    { eyebrow: 'Jul 8, 2025', title: 'Red Poppy', image: '/img/7.jpg' },
  ];
</script>

<template>
  <StackedList :items=&quot;items&quot; />
</template>`"
  >
    <div class="flex size-full min-h-125 items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <StackedList :items="items" />
      </div>
    </div>
  </ComponentDemo>
</template>
