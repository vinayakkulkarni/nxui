<script setup lang="ts">
  import ScrollStack from '@registry/new-york/scroll-stack/ScrollStack.vue';

  const cards = [
    {
      id: 1,
      title: 'Card One',
      description: 'First card in the stack',
      color: '#6366f1',
    },
    {
      id: 2,
      title: 'Card Two',
      description: 'Second card in the stack',
      color: '#8b5cf6',
    },
    {
      id: 3,
      title: 'Card Three',
      description: 'Third card in the stack',
      color: '#a855f7',
    },
    {
      id: 4,
      title: 'Card Four',
      description: 'Fourth card in the stack',
      color: '#d946ef',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollStack from '~/components/ui/ScrollStack.vue';
</script>

<template>
  <ScrollStack :cards='cards' :card-height='200' :card-gap='30' />
</template>`"
  >
    <div class="relative h-full min-h-100 w-full overflow-hidden rounded-lg">
      <ScrollStack :cards="cards" :card-height="200" :card-gap="30" />
    </div>
  </ComponentDemo>
</template>
