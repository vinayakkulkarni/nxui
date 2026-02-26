<script setup lang="ts">
  import PulsatingButton from '@registry/new-york/PulsatingButton/PulsatingButton.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PulsatingButton from '~/components/ui/PulsatingButton.vue';
</script>

<template>
  <PulsatingButton>Click Me</PulsatingButton>
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <PulsatingButton>Click Me</PulsatingButton>
    </div>
  </ComponentDemo>
</template>
