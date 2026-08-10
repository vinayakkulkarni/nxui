<script setup lang="ts">
  import TextString from '@registry/new-york/text-string/TextString.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<TextString text='Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.' />`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-[#f5f0e8] text-[#4a4a4a] dark:bg-zinc-900 dark:text-zinc-300"
    >
      <TextString
        class="absolute inset-0 size-full"
        text="Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do."
      />
    </div>
  </ComponentDemo>
</template>
