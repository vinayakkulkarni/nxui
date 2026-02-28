<script setup lang="ts">
  import TiltedCard from '@registry/new-york/TiltedCard/TiltedCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TiltedCard from '~/components/ui/TiltedCard.vue';
</script>

<template>
  <TiltedCard
    image-src='https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=500&auto=format'
    alt-text='Demo image'
    caption-text='Hover me!'
    container-height='300px'
    container-width='100%'
    image-height='300px'
    image-width='300px'
    :rotate-amplitude='14'
    :scale-on-hover='1.1'
    :show-mobile-warning='true'
    :show-tooltip='true'
  />
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center rounded-lg">
      <TiltedCard
        image-src="https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=500&auto=format"
        alt-text="Demo image"
        caption-text="Hover me!"
        container-height="300px"
        container-width="100%"
        image-height="300px"
        image-width="300px"
        :rotate-amplitude="14"
        :scale-on-hover="1.1"
        :show-mobile-warning="true"
        :show-tooltip="true"
      />
    </div>
  </ComponentDemo>
</template>
