<script setup lang="ts">
  import StarBorder from '@registry/new-york/StarBorder/StarBorder.vue';
</script>

<template>
  <ComponentDemo
    :code="`<StarBorder color='white' speed='6s' :thickness='1' />`"
  >
    <div
      class="flex h-[200px] w-full items-center justify-center bg-black rounded-lg"
    >
      <StarBorder color="white" speed="6s" :thickness="1">
        Star Border Button
      </StarBorder>
    </div>
  </ComponentDemo>
</template>
