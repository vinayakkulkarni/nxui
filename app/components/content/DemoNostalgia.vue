<script setup lang="ts">
  import Nostalgia from '@registry/new-york/nostalgia/Nostalgia.vue';

  const items = [
    {
      src: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format',
      year: '1988',
      title: 'First Breath',
    },
    {
      src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=400&auto=format',
      year: '1994',
      title: 'Six Candles',
    },
    {
      src: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400&auto=format',
      year: '1995',
      title: 'The Sea',
    },
    {
      src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format',
      year: '1997',
      title: 'Backgammon Lessons',
    },
    {
      src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format',
      year: '2001',
      title: 'First Bell',
    },
    {
      src: 'https://images.unsplash.com/photo-1481653125770-b78c206c59d4?q=80&w=400&auto=format',
      year: '2010',
      title: 'Sunday Together',
    },
    {
      src: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?q=80&w=400&auto=format',
      year: '2026',
      title: 'The Same Shore',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Nostalgia from '~/components/ui/nostalgia/Nostalgia.vue';

  const items = [
    { src: '/photos/first-breath.jpg', year: '1988', title: 'First Breath' },
    { src: '/photos/six-candles.jpg', year: '1994', title: 'Six Candles' },
    { src: '/photos/the-sea.jpg', year: '1995', title: 'The Sea' },
    { src: '/photos/backgammon.jpg', year: '1997', title: 'Backgammon Lessons' },
    { src: '/photos/first-bell.jpg', year: '2001', title: 'First Bell' },
  ];
</script>

<template>
  <Nostalgia :items=&quot;items&quot; :interval=&quot;2600&quot; autoplay monochrome />
</template>`"
  >
    <div
      class="flex min-h-112 w-full items-center justify-center rounded-lg bg-neutral-50 p-4 dark:bg-neutral-950"
    >
      <Nostalgia :items="items" :interval="2600" autoplay monochrome />
    </div>
  </ComponentDemo>
</template>
