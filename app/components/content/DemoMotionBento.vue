<script setup lang="ts">
  import MotionBento from '@registry/new-york/motion-bento/MotionBento.vue';
  import type { MotionBentoItem } from '@registry/new-york/motion-bento/types';

  const items: MotionBentoItem[] = [
    {
      title: 'E-Commerce Systems',
      description: 'Storefronts, carts and checkouts that keep orders moving.',
      art: 'commerce',
      span: 7,
    },
    {
      title: 'Enterprise SLA',
      description:
        'Uptime, support and response times written into the contract.',
      art: 'sla',
      span: 5,
    },
    {
      title: 'Custom Development',
      description: 'Tailored systems engineered around your workflow.',
      art: 'integrations',
    },
    {
      title: 'UI/UX Design',
      description: 'Interfaces designed, tested and handed off in one place.',
      art: 'design',
    },
    {
      title: 'Lightning Fast Hosting',
      description: 'Edge hosting that serves every page in milliseconds.',
      art: 'hosting',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MotionBento from '~/components/ui/motion-bento/MotionBento.vue';
  import type { MotionBentoItem } from '~/components/ui/motion-bento/types';

  const items: MotionBentoItem[] = [
    { title: 'E-Commerce Systems', description: 'Storefronts that keep orders moving.', art: 'commerce', span: 7 },
    { title: 'Enterprise SLA', description: 'Uptime written into the contract.', art: 'sla', span: 5 },
    { title: 'Custom Development', description: 'Systems built around your workflow.', art: 'integrations' },
    { title: 'UI/UX Design', description: 'Interfaces designed and handed off.', art: 'design' },
    { title: 'Lightning Fast Hosting', description: 'Pages served in milliseconds.', art: 'hosting' },
  ];
</script>

<template>
  <MotionBento
    heading=&quot;Not a generic agency. A studio with a contractual commitment to performance.&quot;
    highlight=&quot;contractual commitment&quot;
    cta-label=&quot;Book a strategy call&quot;
    :items=&quot;items&quot;
  />
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center-safe justify-center overflow-y-auto p-6"
    >
      <MotionBento
        class="max-w-5xl"
        heading="Not a generic agency. A studio with a contractual commitment to performance."
        highlight="contractual commitment"
        cta-label="Book a strategy call"
        :items="items"
      />
    </div>
  </ComponentDemo>
</template>
