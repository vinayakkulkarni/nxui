<script setup lang="ts">
  import Threads from '@registry/new-york/Threads/Threads.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Threads :color='[1, 1, 1]' :amplitude='1' :distance='0' :enable-mouse-interaction='true' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <Threads
        :color="[1, 1, 1]"
        :amplitude="1"
        :distance="0"
        :enable-mouse-interaction="true"
      />
    </div>
  </ComponentDemo>
</template>
