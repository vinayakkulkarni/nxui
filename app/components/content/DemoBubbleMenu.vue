<script setup lang="ts">
  import BubbleMenu from '@registry/new-york/BubbleMenu/BubbleMenu.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BubbleMenu from '~/components/ui/BubbleMenu.vue';
</script>

<template>
  <BubbleMenu :stagger-delay='80' :animation-duration='500' />
</template>`"
  >
    <div
      class="relative h-[500px] w-full overflow-hidden rounded-lg bg-black/90"
    >
      <BubbleMenu />
    </div>
  </ComponentDemo>
</template>
