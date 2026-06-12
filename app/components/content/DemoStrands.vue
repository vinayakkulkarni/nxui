<script setup lang="ts">
  import Strands from '@registry/new-york/strands/Strands.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Strands from '~/components/ui/Strands.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950&quot;>
    <Strands
      :colors=&quot;['#FF4242', '#7C3AED', '#06B6D4', '#EAB308']&quot;
      :count=&quot;4&quot;
      :speed=&quot;0.6&quot;
      :amplitude=&quot;1.2&quot;
      :waviness=&quot;1.1&quot;
      :thickness=&quot;0.8&quot;
      :glow=&quot;2.8&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <Strands
        :colors="['#FF4242', '#7C3AED', '#06B6D4', '#EAB308']"
        :count="4"
        :speed="0.6"
        :amplitude="1.2"
        :waviness="1.1"
        :thickness="0.8"
        :glow="2.8"
      />
    </div>
  </ComponentDemo>
</template>
