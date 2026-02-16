<script setup lang="ts">
  import ScrollBasedVelocity from '@registry/new-york/ScrollBasedVelocity/ScrollBasedVelocity.vue';
</script>

<template>
  <ComponentDemo
    full-width
    class="overflow-hidden py-8"
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollBasedVelocity from '~/components/ui/ScrollBasedVelocity.vue';
</script>

<template>
  <ScrollBasedVelocity text=&quot;nxui — &quot; />
</template>`"
  >
    <ScrollBasedVelocity text="nxui — " />
  </ComponentDemo>
</template>
