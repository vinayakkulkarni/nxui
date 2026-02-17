<script setup lang="ts">
  import ScrollReveal from '@registry/new-york/ScrollReveal/ScrollReveal.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollReveal from '~/components/ui/ScrollReveal/ScrollReveal.vue';
</script>

<template>
  <ScrollReveal
    text=&quot;Scroll down to reveal this text word by word with a blur effect.&quot;
    :enable-blur=&quot;true&quot;
  />
</template>`"
  >
    <div
      class="flex h-[300px] w-full items-center justify-center overflow-y-auto p-8"
    >
      <ScrollReveal
        text="Scroll down to reveal this text word by word with a blur effect."
        :enable-blur="true"
      />
    </div>
  </ComponentDemo>
</template>
