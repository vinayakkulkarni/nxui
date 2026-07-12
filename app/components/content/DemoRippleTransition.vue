<script setup lang="ts">
  import RippleTransition from '@registry/new-york/ripple-transition/RippleTransition.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import RippleTransition from '~/components/ui/ripple-transition/RippleTransition.vue';
</script>

<template>
  <RippleTransition
    :images=&quot;[
      '/photos/forest.jpg',
      '/photos/canyon.jpg',
      '/photos/river.jpg',
    ]&quot;
    :duration=&quot;1.4&quot;
    auto-play
    :auto-play-interval=&quot;3200&quot;
    auto-play-origin=&quot;random&quot;
    class=&quot;h-100&quot;
  />
  <!-- Click anywhere to ripple from that point -->
</template>`"
  >
    <div class="relative size-full min-h-80">
      <RippleTransition
        auto-play
        :auto-play-interval="3600"
        auto-play-origin="random"
        class="absolute inset-0 size-full"
      />
      <p
        class="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs"
      >
        click anywhere to ripple from that point
      </p>
    </div>
  </ComponentDemo>
</template>
