<script setup lang="ts">
  import Squares from '@registry/new-york/squares/Squares.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Squares from '~/components/ui/Squares/Squares.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <Squares
      :speed=&quot;0.5&quot;
      direction=&quot;diagonal&quot;
      border-color=&quot;#333&quot;
      hover-fill-color=&quot;#222&quot;
      :square-size=&quot;40&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Squares
        :speed="0.5"
        direction="diagonal"
        border-color="#333"
        hover-fill-color="#222"
        :square-size="40"
      />
    </div>
  </ComponentDemo>
</template>
