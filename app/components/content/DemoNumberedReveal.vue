<script setup lang="ts">
  import NumberedReveal from '@registry/new-york/numbered-reveal/NumberedReveal.vue';
  import type { RevealSection } from '@registry/new-york/numbered-reveal/types';

  const sections: RevealSection[] = [
    {
      number: '01',
      title: 'Describing pixels with words',
      body: "Ask an agent to build something today and you get a wall of text in a terminal. You squint at localhost, alt-tab back, type 'no, the spacing is off', pray, repeat.",
    },
    {
      number: '02',
      title: 'Direct with your eyes and hands',
      body: "Your pages and components live on a visual canvas, running live from your own dev server. Point at the thing that is wrong, drag a slider — the edit lands in the agent's context.",
    },
    {
      number: '03',
      title: 'For people who care too much',
      body: 'Every component becomes a playable instrument, with sliders, colors and springs derived from your real code.',
    },
    {
      number: '04',
      title: 'Real code, real repos',
      body: 'Nothing is trapped in a proprietary file; every change lands on disk, ready to commit.',
    },
    {
      number: '05',
      title: 'The loop, killed',
      body: 'You are still designing. You are just directing with your eyes and hands instead of dictating through a prompt.',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import NumberedReveal from '~/components/ui/numbered-reveal/NumberedReveal.vue';
</script>

<template>
  <NumberedReveal :sections=&quot;sections&quot; />
</template>`"
  >
    <div
      class="flex size-full min-h-100 items-center justify-center overflow-y-auto p-6"
    >
      <NumberedReveal :sections="sections" />
    </div>
  </ComponentDemo>
</template>
