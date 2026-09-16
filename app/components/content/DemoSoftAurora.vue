<script setup lang="ts">
  import SoftAurora from '@registry/new-york/soft-aurora/SoftAurora.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SoftAurora from '~/components/ui/SoftAurora.vue';
</script>

<template>
  <SoftAurora color1=&quot;#f7f7f7&quot; color2=&quot;#e100ff&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <ClientOnly><SoftAurora class="absolute inset-0 size-full" /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
