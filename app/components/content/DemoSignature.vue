<script setup lang="ts">
  import Signature from '@registry/new-york/Signature/Signature.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<Signature text='Hello World' :font-size='48' :duration='2' />`"
  >
    <div
      class="flex h-50 w-full items-center justify-center rounded-lg bg-background"
    >
      <Signature text="Hello World" :font-size="48" :duration="2" />
    </div>
  </ComponentDemo>
</template>
