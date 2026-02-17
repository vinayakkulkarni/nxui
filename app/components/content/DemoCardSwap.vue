<script setup lang="ts">
  import CardSwap from '@registry/new-york/CardSwap/CardSwap.vue';
</script>

<template>
  <ComponentDemo
    :code="`<CardSwap :card-distance='60' :vertical-distance='70' :delay='5000' :pause-on-hover='true'>\n  <div class='flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white'>Card 1</div>\n  <div class='flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white'>Card 2</div>\n  <div class='flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white'>Card 3</div>\n</CardSwap>`"
  >
    <div
      class="relative flex h-[450px] w-full items-center justify-center overflow-visible rounded-lg bg-black/5 dark:bg-white/5"
    >
      <CardSwap
        :card-distance="60"
        :vertical-distance="70"
        :delay="5000"
        :pause-on-hover="true"
        class="w-[300px] h-[250px]"
      >
        <div
          class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-xl font-bold text-white"
        >
          Card 1
        </div>
        <div
          class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-xl font-bold text-white"
        >
          Card 2
        </div>
        <div
          class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-xl font-bold text-white"
        >
          Card 3
        </div>
      </CardSwap>
    </div>
  </ComponentDemo>
</template>
