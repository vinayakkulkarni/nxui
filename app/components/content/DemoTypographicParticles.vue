<script setup lang="ts">
  import TypographicParticles from '@registry/new-york/TypographicParticles/TypographicParticles.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TypographicParticles from '~/components/ui/TypographicParticles/TypographicParticles.vue';
</script>

<template>
  <TypographicParticles
    text=&quot;NXUI&quot;
    :cols=&quot;50&quot;
    :rows=&quot;28&quot;
    :font-size=&quot;14&quot;
    :particle-count=&quot;120&quot;
    class=&quot;size-full&quot;
  />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <TypographicParticles class="size-full" />
    </div>
  </ComponentDemo>
</template>
