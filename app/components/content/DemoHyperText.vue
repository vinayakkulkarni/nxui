<script setup lang="ts">
  import HyperText from '@registry/new-york/HyperText/HyperText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import HyperText from '~/components/ui/HyperText.vue';
</script>

<template>
  <HyperText text=&quot;Hyper Text&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <HyperText text="Hyper Text" class="text-4xl font-bold" />
  </ComponentDemo>
</template>
