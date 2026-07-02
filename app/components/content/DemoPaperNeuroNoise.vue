<script setup lang="ts">
  import PaperNeuroNoise from '@registry/new-york/paper-neuro-noise/PaperNeuroNoise.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperNeuroNoise from '~/components/ui/paper-neuro-noise/PaperNeuroNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperNeuroNoise
      :color-front=&quot;'#00c8ff'&quot;
      :color-mid=&quot;'#fbff00'&quot;
      :color-back=&quot;'#8b42ff'&quot;
      :brightness=&quot;0.19&quot;
      :contrast=&quot;0.12&quot;
      :scale=&quot;3&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperNeuroNoise
        :color-front="'#00c8ff'"
        :color-mid="'#fbff00'"
        :color-back="'#8b42ff'"
        :brightness="0.19"
        :contrast="0.12"
        :scale="3"
      />
    </div>
  </ComponentDemo>
</template>
