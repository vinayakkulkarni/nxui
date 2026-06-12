<script setup lang="ts">
  import Lightfall from '@registry/new-york/lightfall/Lightfall.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Lightfall from '~/components/ui/Lightfall.vue';
</script>

<template>
  <Lightfall
    :colors=&quot;['#A6C8FF', '#5227FF', '#FF9FFC']&quot;
    background-color=&quot;#0A29FF&quot;
    :speed=&quot;0.5&quot;
    :streak-count=&quot;2&quot;
    :streak-width=&quot;1&quot;
    :streak-length=&quot;1&quot;
  />
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <Lightfall
        :colors="['#A6C8FF', '#5227FF', '#FF9FFC']"
        background-color="#0A29FF"
        :speed="0.5"
        :streak-count="2"
        :streak-width="1"
        :streak-length="1"
      />
    </div>
  </ComponentDemo>
</template>
