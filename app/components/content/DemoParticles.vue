<script setup lang="ts">
  import Particles from '@registry/new-york/Particles/Particles.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Particles from '~/components/ui/Particles.vue';
</script>

<template>
  <Particles :particle-count='200' :particle-size='3' :speed='0.3' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Particles :particle-count="200" :particle-size="3" :speed="0.3" />
    </div>
  </ComponentDemo>
</template>
