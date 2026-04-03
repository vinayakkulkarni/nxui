<script setup lang="ts">
  import GlitchText from '@registry/new-york/glitch-text/GlitchText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GlitchText from '~/components/ui/GlitchText/GlitchText.vue';
</script>

<template>
  <GlitchText
    text=&quot;Glitch Text&quot;
    :speed=&quot;0.5&quot;
    :enable-shadows=&quot;true&quot;
  />
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center overflow-hidden rounded-lg bg-background"
    >
      <GlitchText text="Glitch Text" class="text-[clamp(2rem,6vw,5rem)]" />
    </div>
  </ComponentDemo>
</template>
