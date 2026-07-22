<script setup lang="ts">
  import CircleInput from '@registry/new-york/circle-input/CircleInput.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CircleInput from '~/components/ui/circle-input/CircleInput.vue';
</script>

<template>
  <CircleInput :words=&quot;['HELLO', 'WORLD']&quot; :length=&quot;5&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <CircleInput :words="['HELLO', 'WORLD']" :length="5" />
    </div>
  </ComponentDemo>
</template>
