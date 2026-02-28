<script setup lang="ts">
  import MagicBento from '@registry/new-york/MagicBento/MagicBento.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MagicBento from '~/components/ui/MagicBento.vue';
</script>

<template>
  <MagicBento
    :items='[
      { title: &quot;Analytics&quot;, description: &quot;Track user behavior&quot;, label: &quot;Insights&quot; },
      { title: &quot;Dashboard&quot;, description: &quot;Centralized data view&quot;, label: &quot;Overview&quot; },
      { title: &quot;Collaboration&quot;, description: &quot;Work together seamlessly&quot;, label: &quot;Teamwork&quot; },
      { title: &quot;Automation&quot;, description: &quot;Streamline workflows&quot;, label: &quot;Efficiency&quot; },
      { title: &quot;Integration&quot;, description: &quot;Connect favorite tools&quot;, label: &quot;Connectivity&quot; },
      { title: &quot;Security&quot;, description: &quot;Enterprise-grade protection&quot;, label: &quot;Protection&quot; },
    ]'
    glow-color='132, 0, 255'
    :enable-spotlight='true'
    :enable-border-glow='true'
    :enable-particles='true'
    :click-effect='true'
  />
</template>`"
  >
    <div
      class="flex w-full items-center justify-center overflow-hidden rounded-lg py-4"
    >
      <MagicBento
        glow-color="132, 0, 255"
        :enable-spotlight="true"
        :enable-border-glow="true"
        :enable-particles="true"
        :click-effect="true"
      />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  /* Force bento 4-col layout at all viewports for the demo */
  :deep(.magic-bento-grid) {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  :deep(.magic-bento-card) {
    min-height: 120px !important;
  }

  :deep(.magic-bento-card:nth-child(3)) {
    grid-column: span 2 !important;
    grid-row: span 2 !important;
  }

  :deep(.magic-bento-card:nth-child(4)) {
    grid-column: 1 / span 2 !important;
    grid-row: 2 / span 2 !important;
  }

  :deep(.magic-bento-card:nth-child(6)) {
    grid-column: 4 !important;
    grid-row: 3 !important;
  }
</style>
