<script setup lang="ts">
  // Floating Tweakpane control panel for shader demos.
  // Wraps v-tweakpane; parent receives the Pane instance via
  // on-pane-created and adds bindings against its reactive params.
  import { VTweakpane } from 'v-tweakpane';
  import 'v-tweakpane/dist/v-tweakpane.css';
  import type { Pane } from 'tweakpane';

  defineProps<{
    title: string;
  }>();

  const emit = defineEmits<{
    'on-pane-created': [pane: Pane];
  }>();

  function onPaneCreated(pane: Pane) {
    emit('on-pane-created', pane);
  }
</script>

<template>
  <div
    class="absolute top-3 right-3 z-10 w-64 opacity-90 transition-opacity hover:opacity-100"
  >
    <ClientOnly>
      <VTweakpane
        :pane="{ title, expanded: true }"
        @on-pane-created="onPaneCreated"
      />
    </ClientOnly>
  </div>
</template>
