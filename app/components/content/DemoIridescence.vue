<script setup lang="ts">
  import Iridescence from '@registry/new-york/Iridescence/Iridescence.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Iridescence from '~/components/ui/Iridescence/Iridescence.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <Iridescence :color=&quot;[1, 1, 1]&quot; :speed=&quot;1.0&quot; :amplitude=&quot;0.1&quot; mouse-react />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Iridescence
        :color="[1, 1, 1]"
        :speed="1.0"
        :amplitude="0.1"
        mouse-react
      />
    </div>
  </ComponentDemo>
</template>
