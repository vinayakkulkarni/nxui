<script setup lang="ts">
  import OrbitCardStack from '@registry/new-york/orbit-card-stack/OrbitCardStack.vue';

  const code = `\x3Cscript setup lang="ts">
  import OrbitCardStack from '~/components/ui/OrbitCardStack/OrbitCardStack.vue';
\x3C/script>

\x3Ctemplate>
  \x3COrbitCardStack />
\x3C/template>
`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      class="relative flex h-125 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/30"
    >
      <OrbitCardStack />
    </div>
  </ComponentDemo>
</template>
