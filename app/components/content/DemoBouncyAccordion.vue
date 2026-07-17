<script setup lang="ts">
  import { ref } from 'vue';
  import BouncyAccordion from '@registry/new-york/bouncy-accordion/BouncyAccordion.vue';

  const active = ref<string | null>('shipping');

  const items = [
    {
      id: 'shipping',
      title: 'How fast is shipping?',
      description:
        'Orders placed before noon ship the same day. Standard delivery lands in 2–4 business days, express in 1–2.',
      icon: 'lucide:truck',
    },
    {
      id: 'returns',
      title: 'What is the return policy?',
      description:
        'Everything can come back within 30 days, no questions asked. Return labels are prepaid and refunds land in 3–5 days.',
      icon: 'lucide:rotate-ccw',
    },
    {
      id: 'warranty',
      title: 'Is there a warranty?',
      description:
        'Two years on every product, covering materials and workmanship. Register your purchase to extend it to three.',
      icon: 'lucide:shield-check',
    },
    {
      id: 'support',
      title: 'How do I reach support?',
      description:
        'Chat with us from the app, or email support — we answer within a couple of hours on weekdays.',
      icon: 'lucide:message-circle',
    },
    {
      id: 'international',
      title: 'Do you ship internationally?',
      description:
        'Yes — to 40+ countries. Duties and taxes are calculated at checkout so there are no surprises at the door.',
      icon: 'lucide:globe',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import BouncyAccordion from '~/components/ui/bouncy-accordion/BouncyAccordion.vue';

  const active = ref<string | null>('shipping');

  const items = [
    {
      id: 'shipping',
      title: 'How fast is shipping?',
      description: 'Orders placed before noon ship the same day.',
      icon: 'lucide:truck',
    },
    {
      id: 'returns',
      title: 'What is the return policy?',
      description: 'Everything can come back within 30 days.',
      icon: 'lucide:rotate-ccw',
    },
  ];
</script>

<template>
  <BouncyAccordion v-model=&quot;active&quot; :items=&quot;items&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="w-full max-w-105">
        <BouncyAccordion v-model="active" :items="items" />
      </div>
    </div>
  </ComponentDemo>
</template>
