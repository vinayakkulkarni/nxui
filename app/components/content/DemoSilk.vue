<script setup lang="ts">
  import Silk from '@registry/new-york/silk/Silk.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Silk from '~/components/ui/Silk.vue';
</script>

<template>
  <Silk :speed='5' :scale='1' color='#7B7481' :noise-intensity='1.5' :rotation='0' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Silk
        :speed="5"
        :scale="1"
        color="#7B7481"
        :noise-intensity="1.5"
        :rotation="0"
      />
    </div>
  </ComponentDemo>
</template>
