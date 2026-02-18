<script setup lang="ts">
  import LiquidEther from '@registry/new-york/LiquidEther/LiquidEther.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidEther from '~/components/ui/LiquidEther.vue';
</script>

<template>
  <LiquidEther :colors=&quot;['#5227FF', '#FF9FFC', '#B19EEF']&quot; :mouse-force=&quot;20&quot; :auto-demo=&quot;true&quot; />
</template>`"
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
