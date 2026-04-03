<script setup lang="ts">
  import ShimmerButton from '@registry/new-york/shimmer-button/ShimmerButton.vue';
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
    <div class="flex size-full items-center justify-center">
      <ShimmerButton>Shimmer</ShimmerButton>
    </div>
  </ComponentDemo>
</template>
