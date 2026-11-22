<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import DeskComputer from '@registry/new-york/desk-computer/DeskComputer.vue';
  import type { DeskComputerTheme } from '@registry/new-york/desk-computer/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<DeskComputerTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive<{ sound: boolean }>({ sound: true });

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'sound');
  }

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import DeskComputer from '~/components/ui/desk-computer/DeskComputer.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
\x3C/script>

<template>
  <div class="relative h-150 w-full">
    <DeskComputer
      fill
      sound
      :theme="theme"
      src="/library/desk-computer.svg"
      class="absolute inset-0"
    />
  </div>
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div class="relative size-full min-h-80">
      <DeskComputer
        fill
        :theme="theme"
        :sound="params.sound"
        class="absolute inset-0 size-full"
      />
      <ShaderPane title="Desk Computer" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
