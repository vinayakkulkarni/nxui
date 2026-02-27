<script setup lang="ts">
  import PixelTransition from '@registry/new-york/PixelTransition/PixelTransition.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelTransition from '~/components/ui/PixelTransition.vue';
</script>

<template>
  <PixelTransition :grid-size='12' pixel-color='#a855f7' :animation-step-duration='0.4'>
    <template #first>First Content</template>
    <template #second>Second Content</template>
  </PixelTransition>
</template>`"
  >
    <div
      class="relative h-[300px] w-full overflow-hidden rounded-lg bg-background"
    >
      <PixelTransition
        :grid-size="12"
        pixel-color="#a855f7"
        :animation-step-duration="0.4"
        class="size-full"
      >
        <template #first>
          <div class="flex size-full items-center justify-center">
            <p class="text-2xl font-bold text-white">Hover Me</p>
          </div>
        </template>
        <template #second>
          <div class="flex size-full items-center justify-center">
            <p class="text-2xl font-bold text-purple-400">Revealed!</p>
          </div>
        </template>
      </PixelTransition>
    </div>
  </ComponentDemo>
</template>
