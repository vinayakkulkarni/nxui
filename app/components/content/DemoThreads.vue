<script setup lang="ts">
  import Threads from '@registry/new-york/threads/Threads.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Threads from '~/components/ui/Threads.vue';
</script>

<template>
  <Threads :color='[1, 1, 1]' :amplitude='1' :distance='0' :enable-mouse-interaction='true' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <Threads
        class="absolute inset-0 size-full"
        :color="[1, 1, 1]"
        :amplitude="1"
        :distance="0"
        :enable-mouse-interaction="true"
      />
    </div>
  </ComponentDemo>
</template>
