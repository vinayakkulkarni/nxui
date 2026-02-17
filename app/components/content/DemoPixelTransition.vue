<script setup lang="ts">
  import PixelTransition from '@registry/new-york/PixelTransition/PixelTransition.vue';
</script>

<template>
  <ComponentDemo
    :code="`<PixelTransition :grid-size='12' pixel-color='#a855f7' :animation-step-duration='0.4'>\n  <template #first>First Content</template>\n  <template #second>Second Content</template>\n</PixelTransition>`"
  >
    <div class="flex h-[300px] w-full items-center justify-center rounded-lg bg-black">
      <PixelTransition
        :grid-size="12"
        pixel-color="#a855f7"
        :animation-step-duration="0.4"
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
