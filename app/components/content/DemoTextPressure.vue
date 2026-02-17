<script setup lang="ts">
  import TextPressure from '@registry/new-york/TextPressure/TextPressure.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextPressure from '~/components/ui/TextPressure/TextPressure.vue';
</script>

<template>
  <TextPressure text=&quot;Pressure&quot; :flex=&quot;true&quot; :weight=&quot;true&quot; />
</template>`"
  >
    <div class="flex h-[300px] w-full items-center justify-center overflow-hidden">
      <TextPressure text="Pressure" :flex="true" :weight="true" />
    </div>
  </ComponentDemo>
</template>
