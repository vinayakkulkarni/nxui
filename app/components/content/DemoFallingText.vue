<script setup lang="ts">
  import FallingText from '@registry/new-york/FallingText/FallingText.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FallingText from '~/components/ui/FallingText.vue';
</script>

<template>
  <FallingText text='nxui makes beautiful components easy' :gravity='1' trigger='auto' />
</template>`"
  >
    <div
      class="relative h-[300px] w-full overflow-hidden rounded-lg bg-background text-foreground"
    >
      <FallingText
        text="nxui makes beautiful components easy"
        :gravity="1"
        trigger="auto"
        :highlight-words="['nxui', 'beautiful']"
        highlight-class="text-purple-400 font-bold"
      />
    </div>
  </ComponentDemo>
</template>
