<script setup lang="ts">
  import CardNav from '@registry/new-york/CardNav/CardNav.vue';
</script>

<template>
  <div class="relative h-80 w-full overflow-hidden rounded-lg bg-zinc-900">
    <CardNav
      :items="[
        {
          label: 'Products',
          bgColor: '#1a1a2e',
          textColor: '#e0e0ff',
          links: [
            { label: 'Analytics', href: '#' },
            { label: 'Automation', href: '#' },
          ],
        },
        {
          label: 'Solutions',
          bgColor: '#16213e',
          textColor: '#b8c0ff',
          links: [
            { label: 'Enterprise', href: '#' },
            { label: 'Startups', href: '#' },
          ],
        },
        {
          label: 'Resources',
          bgColor: '#0f3460',
          textColor: '#a2d2ff',
          links: [
            { label: 'Documentation', href: '#' },
            { label: 'Community', href: '#' },
          ],
        },
      ]"
    />
  </div>
</template>
