<script setup lang="ts">
  import StaggeredMenu from '@registry/new-york/staggered-menu/StaggeredMenu.vue';

  const items = [
    { label: 'Home', link: '#' },
    { label: 'About', link: '#about' },
    { label: 'Projects', link: '#projects' },
    { label: 'Contact', link: '#contact' },
  ];

  const socialItems = [
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'Twitter', link: 'https://twitter.com' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StaggeredMenu from '~/components/ui/StaggeredMenu.vue';
</script>

<template>
  <StaggeredMenu :items='items' :social-items='socialItems' position='right' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <StaggeredMenu
        :items="items"
        :social-items="socialItems"
        position="right"
        :is-fixed="false"
      />
    </div>
  </ComponentDemo>
</template>
