<script setup lang="ts">
  import TrueFocus from '@registry/new-york/true-focus/TrueFocus.vue';
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
    <div class="flex size-full items-center justify-center">
      <TrueFocus sentence="True Focus Effect" />
    </div>
  </ComponentDemo>
</template>
