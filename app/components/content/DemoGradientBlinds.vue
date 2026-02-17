<script setup lang="ts">
  import GradientBlinds from '@registry/new-york/GradientBlinds/GradientBlinds.vue';
</script>

<template>
  <ComponentDemo
    :code="`<GradientBlinds :gradient-colors='[&quot;#FF9FFC&quot;, &quot;#5227FF&quot;, &quot;#B19EEF&quot;]' :blind-count='16' :noise='0.3' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <GradientBlinds
        :gradient-colors="['#FF9FFC', '#5227FF', '#B19EEF']"
        :blind-count="16"
        :noise="0.3"
      />
    </div>
  </ComponentDemo>
</template>
