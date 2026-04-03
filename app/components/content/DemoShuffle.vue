<script setup lang="ts">
  import Shuffle from '@registry/new-york/shuffle/Shuffle.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Shuffle from '~/components/ui/Shuffle/Shuffle.vue';
</script>

<template>
  <Shuffle text=&quot;Shuffle Text&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <Shuffle text="Shuffle Text" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
