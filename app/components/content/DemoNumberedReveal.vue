<script setup lang="ts">
  import NumberedReveal from '@registry/new-york/numbered-reveal/NumberedReveal.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import NumberedReveal from '~/components/ui/numbered-reveal/NumberedReveal.vue';
</script>

<template>
  <NumberedReveal class=&quot;h-120&quot; />
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center justify-center overflow-y-auto p-6"
    >
      <NumberedReveal />
    </div>
  </ComponentDemo>
</template>
