<script setup lang="ts">
  import ScrollChoreography from '@registry/new-york/ScrollChoreography/ScrollChoreography.vue';
</script>

<template>
  <ComponentDemo
    class="p-0"
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrollChoreography from '~/components/ui/ScrollChoreography.vue';
</script>

<template>
  <ScrollChoreography
    :images=&quot;{
      topLeft: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      topRight: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      bottomLeft: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      bottomRight: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    }&quot;
  />
</template>`"
  >
    <div class="relative h-150 w-full overflow-y-auto">
      <ScrollChoreography
        :images="{
          topLeft:
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          topRight:
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
          bottomLeft:
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
          bottomRight:
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        }"
      />
    </div>
  </ComponentDemo>
</template>
