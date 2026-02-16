<script setup lang="ts">
  import TrueFocus from '@registry/new-york/TrueFocus/TrueFocus.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TrueFocus from '~/components/ui/TrueFocus.vue';
</script>

<template>
  <TrueFocus
    sentence=&quot;Hover To Focus&quot;
    manual-mode
    :blur-amount=&quot;5&quot;
    border-color=&quot;cyan&quot;
    glow-color=&quot;rgba(0, 255, 255, 0.6)&quot;
  />
</template>`"
  >
    <TrueFocus
      sentence="Hover To Focus"
      manual-mode
      :blur-amount="5"
      border-color="cyan"
      glow-color="rgba(0, 255, 255, 0.6)"
    />
  </ComponentDemo>
</template>
