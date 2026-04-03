<script setup lang="ts">
  import LetterCascade from '@registry/new-york/letter-cascade/LetterCascade.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LetterCascade from '~/components/ui/LetterCascade.vue';
</script>

<template>
  <LetterCascade text=&quot;Letter Cascade&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <LetterCascade text="Letter Cascade" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
