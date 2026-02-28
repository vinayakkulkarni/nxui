<script setup lang="ts">
  import FaultyTerminal from '@registry/new-york/FaultyTerminal/FaultyTerminal.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FaultyTerminal from '~/components/ui/FaultyTerminal.vue';
</script>

<template>
  <FaultyTerminal :scale='1' :scanline-intensity='0.3' :curvature='0.2' :brightness='1' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <FaultyTerminal
        :scale="1"
        :scanline-intensity="0.3"
        :curvature="0.2"
        :brightness="1"
      />
    </div>
  </ComponentDemo>
</template>
