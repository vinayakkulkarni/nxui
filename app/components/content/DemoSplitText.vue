<script setup lang="ts">
  import SplitText from '@registry/new-york/split-text/SplitText.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SplitText from '~/components/ui/SplitText/SplitText.vue';
</script>

<template>
  <SplitText text=&quot;Hello, Split Text!&quot; by=&quot;chars&quot; :delay=&quot;50&quot; />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <SplitText
        text="Hello, Split Text!"
        by="chars"
        :delay="50"
        class="text-4xl font-bold"
      />
    </div>
  </ComponentDemo>
</template>
