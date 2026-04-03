<script setup lang="ts">
  import BorderGlow from '@registry/new-york/border-glow/BorderGlow.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BorderGlow from '~/components/ui/BorderGlow.vue';
</script>

<template>
  <BorderGlow>
    <div class=&quot;p-8&quot;>
      <h3>Your Content</h3>
      <p>Hover to see the glow effect</p>
    </div>
  </BorderGlow>
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center rounded-lg bg-[#060010]"
    >
      <BorderGlow>
        <div class="px-12 py-8">
          <p class="text-lg font-medium text-white">Border Glow</p>
          <p class="mt-1 text-sm text-white/60">
            Hover near the edges to see the effect
          </p>
        </div>
      </BorderGlow>
    </div>
  </ComponentDemo>
</template>
