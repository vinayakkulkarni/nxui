<script setup lang="ts">
  import SideRays from '@registry/new-york/side-rays/SideRays.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SideRays from '~/components/ui/SideRays.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950&quot;>
    <SideRays
      ray-color1=&quot;#EAB308&quot;
      ray-color2=&quot;#96c8ff&quot;
      :speed=&quot;2.5&quot;
      :intensity=&quot;2&quot;
      :spread=&quot;2&quot;
      origin=&quot;top-right&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <SideRays
        ray-color1="#EAB308"
        ray-color2="#96c8ff"
        :speed="2.5"
        :intensity="2"
        :spread="2"
        origin="top-right"
      />
    </div>
  </ComponentDemo>
</template>
