<script setup lang="ts">
  import PaperWater from '@registry/new-york/paper-water/PaperWater.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWater from '~/components/ui/paper-water/PaperWater.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWater image=&quot;/flowers.webp&quot; :highlights=&quot;0.07&quot; :caustic=&quot;0.1&quot; :waves=&quot;0.3&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWater
        image="/flowers.webp"
        :highlights="0.07"
        :caustic="0.1"
        :waves="0.3"
      />
    </div>
  </ComponentDemo>
</template>
