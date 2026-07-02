<script setup lang="ts">
  import PaperWaves from '@registry/new-york/paper-waves/PaperWaves.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWaves from '~/components/ui/paper-waves/PaperWaves.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWaves
      :color-front=&quot;'#ffbb00'&quot;
      :color-back=&quot;'#000000'&quot;
      :shape=&quot;1.5&quot;
      :frequency=&quot;0.5&quot;
      :amplitude=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWaves
        :color-front="'#ffbb00'"
        :color-back="'#000000'"
        :shape="1.5"
        :frequency="0.5"
        :amplitude="0.5"
      />
    </div>
  </ComponentDemo>
</template>
