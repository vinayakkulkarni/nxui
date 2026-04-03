<script setup lang="ts">
  import FuzzyText from '@registry/new-york/fuzzy-text/FuzzyText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FuzzyText from '~/components/ui/FuzzyText/FuzzyText.vue';
</script>

<template>
  <FuzzyText text=&quot;Fuzzy&quot; :base-intensity=&quot;0.2&quot; :hover-intensity=&quot;0.6&quot; direction=&quot;both&quot; />
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center overflow-hidden bg-background text-foreground"
    >
      <FuzzyText text="Fuzzy" :base-intensity="0.2" :hover-intensity="0.6" />
    </div>
  </ComponentDemo>
</template>
