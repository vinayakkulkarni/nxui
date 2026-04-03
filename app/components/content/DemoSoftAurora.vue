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
    <div class="h-100 w-full overflow-hidden rounded-lg">
      <ClientOnly><SoftAurora /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
