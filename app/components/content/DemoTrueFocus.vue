<script setup lang="ts">
  import TrueFocus from '@registry/new-york/TrueFocus/TrueFocus.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TrueFocus from '~/components/ui/TrueFocus.vue';
</script>

<template>
  <TrueFocus sentence=&quot;True Focus Effect&quot; />
</template>`"
  >
    <TrueFocus sentence="True Focus Effect" />
  </ComponentDemo>
</template>
