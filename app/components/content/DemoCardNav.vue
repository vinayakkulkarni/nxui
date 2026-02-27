<script setup lang="ts">
  import CardNav from '@registry/new-york/CardNav/CardNav.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CardNav from '~/components/ui/CardNav.vue';
</script>

<template>
  <CardNav
    :items=&quot;[
      { label: 'Products', bg-color: '#1a1a2e', text-color: '#e0e0ff', links: [...] },
      { label: 'Solutions', bg-color: '#16213e', text-color: '#b8c0ff', links: [...] },
      { label: 'Resources', bg-color: '#0f3460', text-color: '#a2d2ff', links: [...] },
    ]&quot;
  />
</template>`"
  >
    <div class="relative h-80 w-full overflow-hidden rounded-lg bg-background">
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
  </ComponentDemo>
</template>
