<script setup lang="ts">
  import GhostCursor from '@registry/new-york/GhostCursor/GhostCursor.vue';

  const colorMode = useColorMode();
  const ghostColor = computed(() =>
    colorMode.value === 'dark' ? '#B19EEF' : '#4C1D95',
  );
  const blendMode = computed(() =>
    colorMode.value === 'dark' ? 'screen' : 'multiply',
  );
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GhostCursor from '~/components/ui/GhostCursor.vue';
</script>

<template>
  <GhostCursor color='#B19EEF' :trail-length='50' :bloom-strength='0.1' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <GhostCursor
        :color="ghostColor"
        :mix-blend-mode="blendMode"
        :trail-length="50"
        :bloom-strength="0.1"
      />
    </div>
  </ComponentDemo>
</template>
