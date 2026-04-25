<script setup lang="ts">
  import ScrollSplitCard from '@registry/new-york/scroll-split-card/ScrollSplitCard.vue';

  const cards = [
    {
      title: 'Mountain Views',
      description: 'Breathtaking panoramas from the highest peaks.',
      bgColor: '#1a1a2e',
      textColor: '#ffffff',
    },
    {
      title: 'Forest Trails',
      description: 'Serene paths through ancient woodlands.',
      bgColor: '#16213e',
      textColor: '#e0e0e0',
    },
    {
      title: 'Ocean Waves',
      description: 'The rhythmic pulse of the endless sea.',
      bgColor: '#0f3460',
      textColor: '#ffffff',
    },
  ];
</script>

<template>
  <ComponentDemo
    class="p-0"
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollSplitCard from '~/components/ui/ScrollSplitCard.vue';
</script>

<template>
  <ScrollSplitCard
    image-src=&quot;https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&quot;
    start-hint=&quot;Scroll down&quot;
    end-hint=&quot;So cool, right?&quot;
    :cards=&quot;cards&quot;
  >
    <template #icon-0>
      <Icon name=&quot;lucide:image&quot; class=&quot;size-8 text-white/70&quot; />
    </template>
    <template #icon-1>
      <Icon name=&quot;lucide:globe&quot; class=&quot;size-8 text-white/70&quot; />
    </template>
    <template #icon-2>
      <Icon name=&quot;lucide:calendar&quot; class=&quot;size-8 text-white/70&quot; />
    </template>
  </ScrollSplitCard>
</template>`"
  >
    <div class="relative h-150 w-full overflow-y-auto">
      <ScrollSplitCard
        image-src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"
        start-hint="Scroll down"
        end-hint="So cool, right?"
        :cards="cards"
      >
        <template #icon-0>
          <Icon name="lucide:image" class="size-8 text-white/70" />
        </template>
        <template #icon-1>
          <Icon name="lucide:globe" class="size-8 text-white/70" />
        </template>
        <template #icon-2>
          <Icon name="lucide:calendar" class="size-8 text-white/70" />
        </template>
      </ScrollSplitCard>
    </div>
  </ComponentDemo>
</template>
