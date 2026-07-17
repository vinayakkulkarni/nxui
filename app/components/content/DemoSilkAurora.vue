<script setup lang="ts">
  import SilkAurora from '@registry/new-york/silk-aurora/SilkAurora.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SilkAurora from '~/components/ui/silk-aurora/SilkAurora.vue';
</script>

<template>
  <SilkAurora
    subtitle=&quot;Silk Aurora&quot;
    title=&quot;Night skies, woven in satin&quot;
    description=&quot;Satin-dark aurora ribbons with pearlescent highlights, fine grain, and cursor depth.&quot;
    sheen-color=&quot;#f4dfb8&quot;
    accent-color=&quot;#6ed6c9&quot;
    class=&quot;min-h-screen&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <SilkAurora
        subtitle="Silk Aurora"
        title="Night skies, woven in satin"
        description="Satin-dark aurora ribbons with pearlescent highlights, fine grain, and cursor depth."
        class="absolute inset-0 size-full min-h-0!"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs text-white/40"
      >
        move your cursor to bend the light
      </p>
    </div>
  </ComponentDemo>
</template>
