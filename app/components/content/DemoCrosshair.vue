<script setup lang="ts">
  import Crosshair from '@registry/new-york/crosshair/Crosshair.vue';

  const colorMode = useColorMode();
  const crosshairColor = computed(() =>
    colorMode.value === 'dark' ? 'white' : 'black',
  );
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Crosshair from '~/components/ui/Crosshair.vue';
</script>

<template>
  <Crosshair color='currentColor' />
</template>`"
  >
    <div class="relative h-75 w-full overflow-hidden rounded-lg bg-background">
      <Crosshair :color="crosshairColor">
        <div class="flex size-full items-center justify-center">
          <p class="text-lg text-foreground">Move your cursor</p>
        </div>
      </Crosshair>
    </div>
  </ComponentDemo>
</template>
