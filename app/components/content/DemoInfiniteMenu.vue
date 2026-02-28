<script setup lang="ts">
  import InfiniteMenu from '@registry/new-york/InfiniteMenu/InfiniteMenu.vue';

  const items = [
    {
      image: 'https://picsum.photos/900/900?random=1',
      title: 'Gallery',
      description: 'Browse artwork',
    },
    {
      image: 'https://picsum.photos/900/900?random=2',
      title: 'Studio',
      description: 'Create something',
    },
    {
      image: 'https://picsum.photos/900/900?random=3',
      title: 'Archive',
      description: 'Past projects',
    },
    {
      image: 'https://picsum.photos/900/900?random=4',
      title: 'About',
      description: 'Learn more',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import InfiniteMenu from '~/components/ui/InfiniteMenu.vue';
</script>

<template>
  <InfiniteMenu :items='items' />
</template>`"
  >
    <div class="relative h-125 w-full overflow-hidden rounded-lg">
      <InfiniteMenu :items="items" />
    </div>
  </ComponentDemo>
</template>
