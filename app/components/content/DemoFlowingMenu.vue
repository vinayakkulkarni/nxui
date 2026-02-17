<script setup lang="ts">
  import FlowingMenu from '@registry/new-york/FlowingMenu/FlowingMenu.vue';

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
    :code="`<FlowingMenu :items='menuItems' text-color='#fff' bg-color='#060010' marquee-bg-color='#fff' marquee-text-color='#060010' />`"
  >
    <div class="h-[400px] w-full overflow-hidden rounded-lg">
      <FlowingMenu
        :items="menuItems"
        text-color="#fff"
        bg-color="#060010"
        marquee-bg-color="#fff"
        marquee-text-color="#060010"
      />
    </div>
  </ComponentDemo>
</template>
