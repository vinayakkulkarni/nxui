<script setup lang="ts">
  import FadeContent from '@registry/new-york/FadeContent/FadeContent.vue';
</script>

<template>
  <ComponentDemo :code="`<FadeContent :blur='true' :duration='1' />`">
    <div class="flex h-[200px] w-full items-center justify-center">
      <FadeContent :blur="true" :duration="1">
        <p class="text-2xl font-bold text-foreground">
          Fades in with blur on scroll
        </p>
      </FadeContent>
    </div>
  </ComponentDemo>
</template>
