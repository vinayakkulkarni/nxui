<script setup lang="ts">
  import Crosshair from '@registry/new-york/Crosshair/Crosshair.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Crosshair from '~/components/ui/Crosshair.vue';
</script>

<template>
  <Crosshair color='white' />
</template>`"
  >
    <div
      class="relative h-[300px] w-full overflow-hidden rounded-lg bg-background"
    >
      <Crosshair color="white">
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-white">Move your cursor</p>
        </div>
      </Crosshair>
    </div>
  </ComponentDemo>
</template>
