<script setup lang="ts">
  import TextAnimate from '@registry/new-york/TextAnimate/TextAnimate.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TextAnimate from '~/components/ui/TextAnimate.vue';
</script>

<template>
  <TextAnimate text=&quot;Fade In By Character&quot; animation=&quot;fade-in&quot; by=&quot;character&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <TextAnimate
        text="Fade In By Character"
        animation="fade-in"
        by="character"
        class="text-4xl font-bold text-primary"
      />
    </div>
  </ComponentDemo>
</template>
