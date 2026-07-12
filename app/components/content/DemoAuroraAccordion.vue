<script setup lang="ts">
  import AuroraAccordion from '@registry/new-york/aurora-accordion/AuroraAccordion.vue';

  const items = [
    {
      title: 'What does Blissful Studio do?',
      content:
        'We are a design studio crafting brands, websites, and product interfaces that feel effortless. We partner with founders and teams who sweat the details.',
      icon: 'lucide:sparkles',
    },
    {
      title: 'What services do you offer?',
      content:
        'Brand identity, marketing sites, product design, and design systems — from first sketch to shipped, pixel-perfect build.',
      icon: 'lucide:pen-tool',
    },
    {
      title: 'How does a project run?',
      content:
        'We work in focused weekly sprints with a shared board, async updates, and a demo every Friday. No surprises, no black boxes.',
      icon: 'lucide:compass',
    },
    {
      title: 'Who do you work with?',
      content:
        'Early-stage founders, product teams, and studios who value craft. Most projects start as a two-week engagement.',
      icon: 'lucide:users',
    },
    {
      title: 'How do we get started?',
      content:
        'Send us a short note about your project. We reply within 48 hours with availability, pricing, and a suggested kickoff plan.',
      icon: 'lucide:send',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AuroraAccordion from '~/components/ui/aurora-accordion/AuroraAccordion.vue';

  const items = [
    {
      title: 'What does Blissful Studio do?',
      content: 'We are a design studio crafting brands and websites.',
      icon: 'lucide:sparkles',
    },
    {
      title: 'What services do you offer?',
      content: 'Brand identity, marketing sites, and product design.',
      icon: 'lucide:pen-tool',
    },
  ];
</script>

<template>
  <AuroraAccordion
    :items=&quot;items&quot;
    :aurora-colors=&quot;['#2563eb', '#9333ea', '#ea580c']&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <AuroraAccordion class="max-w-xl" :items="items" />
    </div>
  </ComponentDemo>
</template>
