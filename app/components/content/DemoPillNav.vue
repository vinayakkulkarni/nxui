<script setup lang="ts">
  import PillNav from '@registry/new-york/pill-nav/PillNav.vue';

  const items = [
    { label: 'Home', href: '#' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PillNav from '~/components/ui/PillNav.vue';

  const items = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];
</script>

<template>
  <PillNav :items='items' active-href='/'>
    <template #logo>
      <Icon name='lucide:hexagon' class='size-5' />
    </template>
  </PillNav>
</template>`"
  >
    <div
      class="relative size-full min-h-80 flex items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-zinc-900"
    >
      <PillNav :items="items" active-href="#">
        <template #logo>
          <Icon name="lucide:hexagon" class="size-5" />
        </template>
      </PillNav>
    </div>
  </ComponentDemo>
</template>
