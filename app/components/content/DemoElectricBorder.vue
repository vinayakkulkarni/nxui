<script setup lang="ts">
  import ElectricBorder from '@registry/new-york/ElectricBorder/ElectricBorder.vue';
</script>

<template>
  <ComponentDemo
    :code="`<ElectricBorder color='#5227FF' :speed='1' :chaos='0.12' :border-radius='24'>\n  <div class='p-8'>Content</div>\n</ElectricBorder>`"
  >
    <div
      class="flex h-[300px] w-full items-center justify-center rounded-lg bg-black"
    >
      <ElectricBorder
        color="#5227FF"
        :speed="1"
        :chaos="0.12"
        :border-radius="24"
      >
        <div class="rounded-3xl bg-zinc-900 px-12 py-8">
          <p class="text-lg font-medium text-white">Electric Border</p>
          <p class="mt-1 text-sm text-zinc-400">Hover for chaos</p>
        </div>
      </ElectricBorder>
    </div>
  </ComponentDemo>
</template>
