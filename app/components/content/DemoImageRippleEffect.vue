<script setup lang="ts">
  import ImageRippleEffect from '@registry/new-york/image-ripple-effect/ImageRippleEffect.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ImageRippleEffect from '~/components/ui/ImageRippleEffect.vue';
</script>

<template>
  <ImageRippleEffect
    :images=&quot;[{ src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&amp;h=600&amp;fit=crop', alt: 'Mountains' }]&quot;
  />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <ImageRippleEffect
        :images="[
          {
            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
            alt: 'Mountains',
          },
        ]"
      />
    </div>
  </ComponentDemo>
</template>
