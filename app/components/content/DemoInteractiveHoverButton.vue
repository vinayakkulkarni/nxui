<script setup lang="ts">
  import InteractiveHoverButton from '@registry/new-york/InteractiveHoverButton/InteractiveHoverButton.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import InteractiveHoverButton from '~/components/ui/InteractiveHoverButton.vue';
</script>

<template>
  <InteractiveHoverButton>Hover Me</InteractiveHoverButton>
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <InteractiveHoverButton>Hover Me</InteractiveHoverButton>
    </div>
  </ComponentDemo>
</template>
