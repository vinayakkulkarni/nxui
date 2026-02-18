<script setup lang="ts">
  import FadeContent from '@registry/new-york/FadeContent/FadeContent.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FadeContent from '~/components/ui/FadeContent.vue';
</script>

<template>
  <FadeContent :blur='true' :duration='1' />
</template>`"
  >
    <div class="flex h-[200px] w-full items-center justify-center">
      <FadeContent :blur="true" :duration="1">
        <p class="text-2xl font-bold text-foreground">
          Fades in with blur on scroll
        </p>
      </FadeContent>
    </div>
  </ComponentDemo>
</template>
