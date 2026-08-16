<script setup lang="ts">
  import Signature from '@registry/new-york/signature/Signature.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<Signature text='Hello World' :font-size='48' :duration='2' />`"
  >
    <div
      class="flex size-full min-h-100 items-center justify-center rounded-lg bg-background"
    >
      <Signature text="Hello World" :font-size="48" :duration="2" />
    </div>
  </ComponentDemo>
</template>
