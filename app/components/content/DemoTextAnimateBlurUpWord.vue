<script setup lang="ts">
  import TextAnimate from '@registry/new-york/TextAnimate/TextAnimate.vue';

  const animKey = ref(0);

  function replay() {
    animKey.value++;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TextAnimate from '~/components/ui/TextAnimate.vue';
</script>

<template>
  <TextAnimate text=&quot;Blur In Up By Word&quot; animation=&quot;blur-in-up&quot; by=&quot;word&quot; class=&quot;text-4xl font-bold&quot; />
</template>`"
  >
    <button
      class="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-md border border-border bg-background/50 text-muted-foreground transition-all hover:bg-background hover:text-foreground"
      aria-label="Replay animation"
      @click="replay"
    >
      <Icon name="lucide:rotate-ccw" class="size-4" />
    </button>
    <TextAnimate
      :key="animKey"
      text="Blur In Up By Word"
      animation="blur-in-up"
      by="word"
      class="text-4xl font-bold"
    />
  </ComponentDemo>
</template>
