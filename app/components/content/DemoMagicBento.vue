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
    <div class="flex w-full items-center justify-center rounded-lg py-8">
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
