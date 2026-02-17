<script setup lang="ts">
  import Balatro from '@registry/new-york/Balatro/Balatro.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Balatro from '~/components/ui/Balatro/Balatro.vue';
</script>

<template>
  <div class=&quot;relative h-[400px] w-full overflow-hidden rounded-lg&quot;>
    <Balatro
      color1=&quot;#DE443B&quot;
      color2=&quot;#006BB4&quot;
      color3=&quot;#162325&quot;
      :spin-speed=&quot;7&quot;
      mouse-interaction
    />
  </div>
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <Balatro
        color1="#DE443B"
        color2="#006BB4"
        color3="#162325"
        :spin-speed="7"
        mouse-interaction
      />
    </div>
  </ComponentDemo>
</template>
