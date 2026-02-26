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
  <TextAnimate text=&quot;Beautiful Animations&quot; animation=&quot;blur-in-up&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <TextAnimate
        text="Beautiful Animations"
        animation="blur-in-up"
        class="text-4xl font-bold"
      />
    </div>
  </ComponentDemo>
</template>
