<script setup lang="ts">
  import ShowcaseCard from '@registry/new-york/ShowcaseCard/ShowcaseCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShowcaseCard from '~/components/ui/ShowcaseCard.vue';
</script>

<template>
  <ShowcaseCard
    tagline=&quot;Work fast. Live slow.&quot;
    heading=&quot;Create your digital reality.&quot;
    description=&quot;From nothing to everything.&quot;
    image-url=&quot;/images/showcase.jpg&quot;
    cta-text=&quot;Send a message&quot;
  />
</template>`"
  >
    <div class="flex size-full items-center justify-center p-4">
      <ShowcaseCard
        tagline="Work fast. Live slow."
        heading="Create your digital reality."
        description="From nothing to everything, let's bring your vision to life."
        image-url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
        cta-text="Send a message"
        brand-name="studio.design"
        :services="['web', 'product', 'brand']"
      />
    </div>
  </ComponentDemo>
</template>
