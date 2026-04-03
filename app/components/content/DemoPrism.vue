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
    <div class="h-100 w-full overflow-hidden rounded-lg">
      <ClientOnly><Prism /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
