<script setup lang="ts">
  import PaperLiquidMetal from '@registry/new-york/paper-liquid-metal/PaperLiquidMetal.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperLiquidMetal from '~/components/ui/paper-liquid-metal/PaperLiquidMetal.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperLiquidMetal
      :image=&quot;'/flowers.webp'&quot;
      :color-back=&quot;'#AAAAAC'&quot;
      :color-tint=&quot;'#ffffff'&quot;
      :contour=&quot;0.4&quot;
      :distortion=&quot;0.07&quot;
      :repetition=&quot;2&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperLiquidMetal
        image="/flowers.webp"
        color-back="#AAAAAC"
        color-tint="#ffffff"
        :contour="0.4"
        :distortion="0.07"
        :repetition="2"
        shape="diamond"
      />
    </div>
  </ComponentDemo>
</template>
