<script setup lang="ts">
  import StickyScrollCards from '@registry/new-york/sticky-scroll-cards/StickyScrollCards.vue';

  const cards = [
    {
      title: 'Mountains',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    },
    {
      title: 'Forest',
      src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    },
    {
      title: 'Ocean',
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    },
    {
      title: 'Desert',
      src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
    },
  ];
</script>

<template>
  <ComponentDemo
    class="p-0"
    :code="`<script setup lang=&quot;ts&quot;>
  import StickyScrollCards from '~/components/ui/StickyScrollCards.vue';

  const cards = [
    { title: 'Mountains', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { title: 'Forest',    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
    { title: 'Ocean',     src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
    { title: 'Desert',    src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800' },
  ];
</script>

<template>
  <StickyScrollCards :cards=&quot;cards&quot; />
</template>`"
  >
    <div class="relative h-150 w-full overflow-y-auto rounded-lg">
      <StickyScrollCards :cards="cards" />
    </div>
  </ComponentDemo>
</template>
