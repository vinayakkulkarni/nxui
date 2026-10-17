<script setup lang="ts">
  import CaseStudyFlipStack from '@registry/new-york/case-study-flip-stack/CaseStudyFlipStack.vue';
</script>

<template>
  <ComponentDemo
    class="p-0"
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CaseStudyFlipStack from '~/components/ui/case-study-flip-stack/CaseStudyFlipStack.vue';
  import type { CaseStudyFlipItem } from '~/components/ui/case-study-flip-stack/types';

  const items: CaseStudyFlipItem[] = [
    {
      eyebrow: 'Fintech',
      title: 'Boosted conversion by 42% with a product-led redesign',
      description: 'We rebuilt onboarding around the moments that matter.',
      image: '/work/fintech.jpg',
      imageAlt: 'Portrait from the fintech campaign',
      background: '#a94808',
      foreground: '#fff7ed',
    },
    {
      eyebrow: 'Hospitality',
      title: 'A slower digital experience for a faster-growing retreat',
      description: 'A cinematic booking journey with a stronger sense of place.',
      image: '/work/retreat.jpg',
      imageAlt: 'A mountain retreat at dusk',
      background: '#067b8f',
      foreground: '#ecfeff',
    },
  ];
</script>

<template>
  <CaseStudyFlipStack
    :items=&quot;items&quot;
    hint=&quot;Scroll Down&quot;
    heading=&quot;Design That Delivers.&quot;
    end-label=&quot;The End&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-y-auto">
      <CaseStudyFlipStack />
    </div>
  </ComponentDemo>
</template>
