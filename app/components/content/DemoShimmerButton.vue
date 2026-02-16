<script setup lang="ts">
  import ShimmerButton from '@registry/new-york/ShimmerButton/ShimmerButton.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShimmerButton from '~/components/ui/ShimmerButton.vue';
</script>

<template>
  <ShimmerButton>Shimmer</ShimmerButton>
</template>`"
  >
    <ShimmerButton>Shimmer</ShimmerButton>
  </ComponentDemo>
</template>
