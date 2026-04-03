<script setup lang="ts">
  import DarkVeil from '@registry/new-york/dark-veil/DarkVeil.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DarkVeil from '~/components/ui/DarkVeil.vue';
</script>

<template>
  <DarkVeil :hue-shift='120' :speed='0.5' :noise-intensity='0.05' :scanline-intensity='0.15' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <DarkVeil
        :hue-shift="120"
        :speed="0.5"
        :noise-intensity="0.05"
        :scanline-intensity="0.15"
      />
    </div>
  </ComponentDemo>
</template>
