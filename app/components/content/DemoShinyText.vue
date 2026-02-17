<script setup lang="ts">
  import ShinyText from '@registry/new-york/ShinyText/ShinyText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShinyText from '~/components/ui/ShinyText/ShinyText.vue';
</script>

<template>
  <ShinyText text=&quot;Shiny Text&quot; :speed=&quot;5&quot; />
</template>`"
  >
    <div class="flex h-[200px] w-full items-center justify-center">
      <ShinyText text="Shiny Text" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
