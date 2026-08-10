<script setup lang="ts">
  import Prism from '@registry/new-york/prism/Prism.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Prism from '~/components/ui/Prism.vue';
</script>

<template>
  <Prism />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <ClientOnly><Prism class="absolute inset-0 size-full" /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
