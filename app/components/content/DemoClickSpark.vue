<script setup lang="ts">
  import ClickSpark from '@registry/new-york/ClickSpark/ClickSpark.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ClickSpark from '~/components/ui/ClickSpark.vue';
</script>

<template>
  <ClickSpark spark-color='#fff' :spark-size='10' :spark-count='8' />
</template>`"
  >
    <div
      class="relative h-[300px] w-full overflow-hidden rounded-lg bg-background"
    >
      <ClickSpark spark-color="#fff" :spark-size="10" :spark-count="8">
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-foreground">Click anywhere for sparks!</p>
        </div>
      </ClickSpark>
    </div>
  </ComponentDemo>
</template>
