<script setup lang="ts">
  import ScrollFloat from '@registry/new-york/ScrollFloat/ScrollFloat.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollFloat from '~/components/ui/ScrollFloat/ScrollFloat.vue';
</script>

<template>
  <ScrollFloat text=&quot;Scroll Float&quot; :stagger=&quot;0.03&quot; />
</template>`"
  >
    <div
      class="flex h-[300px] w-full items-center justify-center overflow-y-auto p-8"
    >
      <ScrollFloat text="Scroll Float" :stagger="0.03" />
    </div>
  </ComponentDemo>
</template>
