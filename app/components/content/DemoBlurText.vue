<script setup lang="ts">
  import BlurText from '@registry/new-york/BlurText/BlurText.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import BlurText from '~/components/ui/BlurText/BlurText.vue';
</script>

<template>
  <BlurText text=&quot;Blur Text Effect&quot; by=&quot;words&quot; :delay=&quot;200&quot; />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <BlurText
        text="Blur Text Effect"
        by="words"
        :delay="200"
        class="text-4xl font-bold"
      />
    </div>
  </ComponentDemo>
</template>
