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
  <TextAnimate text=&quot;Scale Up!&quot; animation=&quot;scale-up&quot; by=&quot;text&quot; class=&quot;text-5xl font-black&quot; />
</template>`"
  >
    <TextAnimate
      text="Scale Up!"
      animation="scale-up"
      by="text"
      class="text-5xl font-black"
    />
  </ComponentDemo>
</template>
