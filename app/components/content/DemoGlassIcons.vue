<script setup lang="ts">
  import GlassIcons from '@registry/new-york/GlassIcons/GlassIcons.vue';

  const items = [
    { icon: 'lucide:home', label: 'Home', color: 'blue' },
    { icon: 'lucide:settings', label: 'Settings', color: 'purple' },
    { icon: 'lucide:heart', label: 'Favorites', color: 'red' },
    { icon: 'lucide:star', label: 'Starred', color: 'orange' },
    { icon: 'lucide:user', label: 'Profile', color: 'indigo' },
    { icon: 'lucide:shield', label: 'Security', color: 'green' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<GlassIcons :items='items' />`"
  >
    <div class="flex h-[400px] w-full items-center justify-center rounded-lg">
      <GlassIcons :items="items" />
    </div>
  </ComponentDemo>
</template>
