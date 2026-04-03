<script setup lang="ts">
  import ShinyText from '@registry/new-york/shiny-text/ShinyText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShinyText from '~/components/ui/ShinyText/ShinyText.vue';
</script>

<template>
  <ShinyText text=&quot;Shiny Text&quot; :speed=&quot;2&quot; color=&quot;#b5b5b5&quot; shine-color=&quot;#ffffff&quot; />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <ShinyText text="Shiny Text" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
