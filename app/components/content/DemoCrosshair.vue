<script setup lang="ts">
  import Crosshair from '@registry/new-york/Crosshair/Crosshair.vue';
</script>

<template>
  <ComponentDemo :code="`<Crosshair color='white' />`">
    <div class="relative h-[300px] w-full overflow-hidden rounded-lg bg-black">
      <Crosshair color="white">
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-white">Move your cursor</p>
        </div>
      </Crosshair>
    </div>
  </ComponentDemo>
</template>
