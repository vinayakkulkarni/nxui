<script setup lang="ts">
  import ElasticSlider from '@registry/new-york/ElasticSlider/ElasticSlider.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ElasticSlider from '~/components/ui/ElasticSlider.vue';
</script>

<template>
  <ElasticSlider :default-value='50' :starting-value='0' :max-value='100' />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center rounded-lg">
      <ElasticSlider :default-value="50" :starting-value="0" :max-value="100" />
    </div>
  </ComponentDemo>
</template>
