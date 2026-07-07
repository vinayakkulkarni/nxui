<script setup lang="ts">
  import PodcastPlayer from '@registry/new-york/podcast-player/PodcastPlayer.vue';

  const chapters = [
    { time: 0, label: 'Cold open' },
    { time: 156, label: 'Indicator #1: The vibe' },
    { time: 372, label: 'Indicator #2: Rate cuts' },
    { time: 612, label: 'Indicator #3: Eggs' },
    { time: 858, label: 'Listener picks' },
    { time: 1020, label: 'Credits' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PodcastPlayer from '~/components/ui/podcast-player/PodcastPlayer.vue';

  const chapters = [
    { time: 0, label: 'Cold open' },
    { time: 156, label: 'Indicator #1: The vibe' },
    { time: 372, label: 'Indicator #2: Rate cuts' },
    { time: 612, label: 'Indicator #3: Eggs' },
  ];
</script>

<template>
  <PodcastPlayer
    src=&quot;/audio/episode.mp3&quot;
    title=&quot;Indicators of the Year&quot;
    show=&quot;Planet Money&quot;
    date=&quot;12/31/2025&quot;
    rating=&quot;4.6&quot;
    rating-count=&quot;30K&quot;
    :meta=&quot;['Business', 'Updated daily']&quot;
    description=&quot;Our favorite economic indicators of the year, ranked and roasted.&quot;
    :chapters=&quot;chapters&quot;
    accent=&quot;#f4502c&quot;
  />
</template>`"
  >
    <div
      class="flex min-h-130 w-full items-center justify-center rounded-lg bg-neutral-100 p-4 sm:p-8 dark:bg-neutral-950"
    >
      <PodcastPlayer
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        title="Indicators of the Year"
        show="Planet Money"
        date="12/31/2025"
        rating="4.6"
        rating-count="30K"
        :meta="['Business', 'Updated daily']"
        description="Our favorite economic indicators of the year, ranked and roasted. The team argues over what actually moved the needle — from the price of eggs to the month everyone decided the recession was cancelled."
        :chapters="chapters"
        accent="#f4502c"
      />
    </div>
  </ComponentDemo>
</template>
