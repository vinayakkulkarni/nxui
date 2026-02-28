<script setup lang="ts">
  import Waves from '@registry/new-york/Waves/Waves.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Waves from '~/components/ui/Waves/Waves.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <Waves line-color=&quot;#fff&quot; background-color=&quot;#000&quot; :wave-speed-x=&quot;0.02&quot; :wave-amp-x=&quot;40&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Waves
        line-color="#fff"
        background-color="#000"
        :wave-speed-x="0.02"
        :wave-amp-x="40"
      />
    </div>
  </ComponentDemo>
</template>
