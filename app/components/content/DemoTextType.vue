<script setup lang="ts">
  import TextType from '@registry/new-york/TextType/TextType.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextType from '~/components/ui/TextType/TextType.vue';
</script>

<template>
  <TextType
    :text=&quot;['Hello World!', 'Welcome to nxui.', 'Build something amazing.']&quot;
    :typing-speed=&quot;50&quot;
  />
</template>`"
  >
    <div class="flex h-[200px] w-full items-center justify-center">
      <TextType
        :text="['Hello World!', 'Welcome to nxui.', 'Build something amazing.']"
        :typing-speed="50"
        class="text-4xl font-bold"
      />
    </div>
  </ComponentDemo>
</template>
