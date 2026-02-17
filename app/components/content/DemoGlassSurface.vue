<script setup lang="ts">
  import GlassSurface from '@registry/new-york/GlassSurface/GlassSurface.vue';
</script>

<template>
  <div
    class="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
  >
    <div
      class="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-8 opacity-60"
    >
      <div class="size-20 rounded-full bg-yellow-400/50"></div>
      <div class="size-16 rounded-lg bg-cyan-400/50"></div>
      <div class="size-24 rounded-full bg-green-400/40"></div>
      <div class="size-12 rounded-full bg-red-400/50"></div>
    </div>

    <GlassSurface
      :width="280"
      :height="100"
      :border-radius="20"
      :brightness="50"
      :opacity="0.93"
      :blur="11"
    >
      <span class="text-lg font-semibold text-white drop-shadow-md"
        >Glass Surface</span
      >
    </GlassSurface>
  </div>
</template>
