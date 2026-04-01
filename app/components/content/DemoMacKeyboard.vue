<script setup lang="ts">
  import MacKeyboard from '@registry/new-york/MacKeyboard/MacKeyboard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MacKeyboard from '~/components/ui/MacKeyboard.vue';
</script>

<template>
  <MacKeyboard />
</template>`"
  >
    <div
      class="flex w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-8 dark:bg-zinc-950"
    >
      <MacKeyboard />
    </div>
  </ComponentDemo>
</template>
