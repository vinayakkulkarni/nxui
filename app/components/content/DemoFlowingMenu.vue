<script setup lang="ts">
  import FlowingMenu from '@registry/new-york/flowing-menu/FlowingMenu.vue';

  const menuItems = [
    {
      link: '#',
      text: 'Animations',
      image: 'https://picsum.photos/seed/1/600/400',
    },
    {
      link: '#',
      text: 'Components',
      image: 'https://picsum.photos/seed/2/600/400',
    },
    {
      link: '#',
      text: 'Backgrounds',
      image: 'https://picsum.photos/seed/3/600/400',
    },
    {
      link: '#',
      text: 'Text Effects',
      image: 'https://picsum.photos/seed/4/600/400',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FlowingMenu from '~/components/ui/FlowingMenu.vue';
</script>

<template>
  <FlowingMenu :items='menuItems' text-color='#fff' bg-color='#000' marquee-bg-color='#fff' marquee-text-color='#000' />
</template>`"
    full-width
    class="p-0"
  >
    <div class="h-125 w-full">
      <FlowingMenu
        :items="menuItems"
        text-color="#fff"
        bg-color="#000"
        marquee-bg-color="#fff"
        marquee-text-color="#000"
      />
    </div>
  </ComponentDemo>
</template>
