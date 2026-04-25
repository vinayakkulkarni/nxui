<script setup lang="ts">
  import MusicPlayer from '@registry/new-york/music-player/MusicPlayer.vue';

  const code = `<script setup lang="ts">
  import MusicPlayer from '~/components/ui/music-player/MusicPlayer.vue';
</script>

<template>
  <MusicPlayer
    src="https://www.youtube.com/watch?v=jfKfPfyJRdk"
    cover-art="https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&q=80"
    :auto-play="false"
  />
</template>`;
</script>

<template>
  <ComponentDemo class="min-h-0 p-4" :code="code">
    <div class="flex size-full items-center justify-center p-4">
      <MusicPlayer
        src="https://www.youtube.com/watch?v=jfKfPfyJRdk"
        cover-art="https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&q=80"
        :auto-play="false"
      />
    </div>
  </ComponentDemo>
</template>
