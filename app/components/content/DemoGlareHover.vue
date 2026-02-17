<script setup lang="ts">
  import GlareHover from '@registry/new-york/GlareHover/GlareHover.vue';
</script>

<template>
  <ComponentDemo
    :code="`<GlareHover width='300px' height='200px' background='#1a1a2e' border-color='#333' glare-color='#ffffff' />`"
  >
    <div class="flex h-[300px] w-full items-center justify-center rounded-lg bg-black">
      <GlareHover
        width="300px"
        height="200px"
        background="#1a1a2e"
        border-color="#333"
        glare-color="#ffffff"
      >
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-white">Hover me</p>
        </div>
      </GlareHover>
    </div>
  </ComponentDemo>
</template>
