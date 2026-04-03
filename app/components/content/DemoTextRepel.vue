<script setup lang="ts">
  import TextRepel from '@registry/new-york/text-repel/TextRepel.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextRepel from '~/components/ui/TextRepel.vue';
</script>

<template>
  <TextRepel text=&quot;Hover Me&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <TextRepel text="Hover Me" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
