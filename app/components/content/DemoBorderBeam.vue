<script setup lang="ts">
import BorderBeam from '@registry/new-york/BorderBeam/BorderBeam.vue';
</script>

<template>
  <ComponentDemo>
    <div class="relative flex h-[200px] w-full max-w-md items-center justify-center overflow-hidden rounded-xl border bg-background">
      <div class="z-10 text-center">
        <h3 class="text-2xl font-bold tracking-tight">Border Beam</h3>
        <p class="text-sm text-muted-foreground">The beam follows the border path</p>
      </div>
      <BorderBeam />
    </div>
  </ComponentDemo>
</template>
