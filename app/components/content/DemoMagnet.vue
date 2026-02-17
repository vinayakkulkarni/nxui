<script setup lang="ts">
  import Magnet from '@registry/new-york/Magnet/Magnet.vue';
</script>

<template>
  <ComponentDemo :code="`<Magnet :padding='100' :magnet-strength='2' />`">
    <div class="flex h-[200px] w-full items-center justify-center">
      <Magnet :padding="100" :magnet-strength="2">
        <button class="rounded-lg bg-primary px-6 py-3 text-primary-foreground">
          Hover near me
        </button>
      </Magnet>
    </div>
  </ComponentDemo>
</template>
