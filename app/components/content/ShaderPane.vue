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

  // Props are documented kebab-case everywhere in nxui (templates, docs).
  // Tweakpane defaults binding labels to the raw object key (camelCase),
  // so default every label to its kebab-case form for consistency.
  function toKebabCase(key: string): string {
    return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function onPaneCreated(pane: Pane) {
    type AddBinding = typeof pane.addBinding;
    const original = pane.addBinding.bind(pane) as AddBinding;
    pane.addBinding = ((
      obj: Record<string, unknown>,
      key: string,
      opts?: Record<string, unknown>,
    ) =>
      original(obj, key, { label: toKebabCase(key), ...opts })) as AddBinding;
    emit('on-pane-created', pane);
  }
</script>

<template>
  <div
    class="absolute top-16 right-3 z-10 max-h-[calc(100%-5rem)] w-64 overflow-y-auto opacity-90 transition-opacity hover:opacity-100"
  >
    <ClientOnly>
      <VTweakpane
        :pane="{ title, expanded: true }"
        @on-pane-created="onPaneCreated"
      />
    </ClientOnly>
  </div>
</template>
