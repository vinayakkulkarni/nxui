<script setup lang="ts">
  import TextAnimate from '@registry/new-york/text-animate/TextAnimate.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TextAnimate from '~/components/ui/TextAnimate.vue';
</script>

<template>
  <TextAnimate text=&quot;Word Split Animation&quot; animation=&quot;fade-in&quot; by=&quot;word&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <TextAnimate
        text="Word Split Animation"
        animation="fade-in"
        by="word"
        class="text-4xl font-bold text-primary"
      />
    </div>
  </ComponentDemo>
</template>
