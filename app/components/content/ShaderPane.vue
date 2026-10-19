<script setup lang="ts">
  // Floating Tweakpane control panel for shader demos.
  // Wraps v-tweakpane; parent receives the Pane instance via
  // on-pane-created and adds bindings against its reactive params.
  import { VTweakpane } from 'v-tweakpane';
  import 'v-tweakpane/dist/index.css';
  import { useMediaQuery } from '@vueuse/core';
  import type { Pane } from 'tweakpane';

  const props = withDefaults(
    defineProps<{
      title: string;
      /** Open on load. Folded panes keep the demo in view; the title bar opens them. */
      expanded?: boolean;
    }>(),
    { expanded: false },
  );

  const emit = defineEmits<{
    'on-pane-created': [pane: Pane];
  }>();

  // Props are documented kebab-case everywhere in nxui (templates, docs).
  // Tweakpane defaults binding labels to the raw object key (camelCase),
  // so default every label to its kebab-case form for consistency.
  function toKebabCase(key: string): string {
    return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Gallery cards on /docs show the demo only; the controls stay on its page.
  const inGallery = inject('gallery-preview', false);

  // On phones the open pane covers the demo, so it starts folded there.
  const wide = useMediaQuery('(min-width: 640px)');

  function onPaneCreated(pane: Pane) {
    type AddBinding = typeof pane.addBinding;
    const original = pane.addBinding.bind(pane) as AddBinding;
    pane.addBinding = ((
      obj: Record<string, unknown>,
      key: string,
      opts?: Record<string, unknown>,
    ) =>
      original(obj, key, { label: toKebabCase(key), ...opts })) as AddBinding;
    pane.expanded = props.expanded && wide.value;
    emit('on-pane-created', pane);
  }
</script>

<template>
  <div
    v-if="!inGallery"
    class="absolute top-16 right-3 z-10 max-h-[calc(100%-5rem)] w-48 sm:w-64 overflow-y-auto opacity-90 transition-opacity hover:opacity-100"
  >
    <ClientOnly>
      <VTweakpane
        :pane="{ title, expanded: true }"
        @on-pane-created="onPaneCreated"
      />
    </ClientOnly>
  </div>
</template>
