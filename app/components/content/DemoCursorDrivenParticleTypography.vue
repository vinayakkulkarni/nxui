<script setup lang="ts">
  import CursorDrivenParticleTypography from '@registry/new-york/CursorDrivenParticleTypography/CursorDrivenParticleTypography.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CursorDrivenParticleTypography from '~/components/ui/CursorDrivenParticleTypography.vue';
</script>

<template>
  <CursorDrivenParticleTypography text=&quot;nxui&quot; class=&quot;h-75 w-full&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <CursorDrivenParticleTypography text="nxui" class="h-75 w-full" />
    </div>
  </ComponentDemo>
</template>
