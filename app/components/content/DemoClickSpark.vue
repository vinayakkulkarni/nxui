<script setup lang="ts">
  import ClickSpark from '@registry/new-york/ClickSpark/ClickSpark.vue';
</script>

<template>
  <ComponentDemo
    :code="`<ClickSpark spark-color='#fff' :spark-size='10' :spark-count='8' />`"
  >
    <div class="relative h-[300px] w-full overflow-hidden rounded-lg bg-black">
      <ClickSpark spark-color="#fff" :spark-size="10" :spark-count="8">
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-white">Click anywhere for sparks!</p>
        </div>
      </ClickSpark>
    </div>
  </ComponentDemo>
</template>
