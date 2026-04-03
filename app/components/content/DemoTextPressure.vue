<script setup lang="ts">
  import TextPressure from '@registry/new-york/text-pressure/TextPressure.vue';
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
    <div class="flex size-full items-center justify-center overflow-hidden">
      <div class="h-75 w-full">
        <TextPressure text="Pressure" :flex="true" :weight="true" />
      </div>
    </div>
  </ComponentDemo>
</template>
