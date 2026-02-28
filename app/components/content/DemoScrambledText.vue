<script setup lang="ts">
  import ScrambledText from '@registry/new-york/ScrambledText/ScrambledText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrambledText from '~/components/ui/ScrambledText/ScrambledText.vue';
</script>

<template>
  <ScrambledText
    text=&quot;Move your cursor over this text to scramble it.&quot;
    :radius=&quot;100&quot;
    :speed=&quot;50&quot;
  />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center p-8">
      <ScrambledText
        text="Move your cursor over this text to scramble it."
        :radius="100"
        :speed="50"
        class="text-xl"
      />
    </div>
  </ComponentDemo>
</template>
