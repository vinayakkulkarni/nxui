<script setup lang="ts">
  import GlareHover from '@registry/new-york/glare-hover/GlareHover.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GlareHover from '~/components/ui/GlareHover.vue';
</script>

<template>
  <GlareHover width='300px' height='200px' background='var(--card)' border-color='var(--border)' glare-color='#ffffff' />
</template>`"
  >
    <div
      class="flex h-75 w-full items-center justify-center rounded-lg bg-background"
    >
      <GlareHover
        width="300px"
        height="200px"
        background="var(--card)"
        border-color="var(--border)"
        glare-color="#ffffff"
      >
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-foreground">Hover me</p>
        </div>
      </GlareHover>
    </div>
  </ComponentDemo>
</template>
