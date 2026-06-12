<script setup lang="ts">
  import Ferrofluid from '@registry/new-york/ferrofluid/Ferrofluid.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Ferrofluid from '~/components/ui/Ferrofluid.vue';
</script>

<template>
  <Ferrofluid :colors=&quot;['#4F46E5', '#06B6D4', '#E0F2FE']&quot; :speed=&quot;0.5&quot; :scale=&quot;1.6&quot; />
</template>`"
  >
    <div
      class="relative h-100 w-full overflow-hidden rounded-lg bg-neutral-950"
    >
      <Ferrofluid
        :colors="['#4F46E5', '#06B6D4', '#E0F2FE']"
        :speed="0.5"
        :scale="1.6"
      />
    </div>
  </ComponentDemo>
</template>
