<script setup lang="ts">
  import LiquidEther from '@registry/new-york/LiquidEther/LiquidEther.vue';
</script>

<template>
  <ComponentDemo
    :code="`<LiquidEther :colors='[&quot;#5227FF&quot;, &quot;#FF9FFC&quot;, &quot;#B19EEF&quot;]' :mouse-force='20' :auto-demo='true' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <LiquidEther
        :colors="['#5227FF', '#FF9FFC', '#B19EEF']"
        :mouse-force="20"
        :auto-demo="true"
      />
    </div>
  </ComponentDemo>
</template>
