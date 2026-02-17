<script setup lang="ts">
  import Stack from '@registry/new-york/Stack/Stack.vue';

  const images = [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<Stack :sensitivity='200' :send-to-back-on-click='true' :card-dimensions='{ width: 200, height: 200 }'>
  <img v-for='src in images' :key='src' :src='src' class='size-full rounded-2xl object-cover' />
</Stack>`"
  >
    <div class="flex h-[400px] w-full items-center justify-center rounded-lg">
      <div class="relative size-[200px]">
        <Stack
          :sensitivity="200"
          :send-to-back-on-click="true"
          :card-dimensions="{ width: 200, height: 200 }"
        >
          <img
            v-for="src in images"
            :key="src"
            :src="src"
            class="size-full rounded-2xl object-cover"
          />
        </Stack>
      </div>
    </div>
  </ComponentDemo>
</template>
