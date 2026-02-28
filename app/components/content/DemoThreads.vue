<script setup lang="ts">
  import Threads from '@registry/new-york/Threads/Threads.vue';
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
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <Threads
        :color="[1, 1, 1]"
        :amplitude="1"
        :distance="0"
        :enable-mouse-interaction="true"
      />
    </div>
  </ComponentDemo>
</template>
