<script setup lang="ts">
  import { reactive } from 'vue';
  import BlobCursor from '@registry/new-york/blob-cursor/BlobCursor.vue';
  import type { BlobCursorSettings } from '@registry/new-york/blob-cursor/types';
  import type { Pane } from 'tweakpane';

  const params = reactive<BlobCursorSettings>({
    material: 'chrome',
    color: '#3B82F6',
    blend: 'normal',
    size: 140,
    morph: 0,
    morphSpeed: 0.4,
    depth: 1,
    trail: 16,
    lag: 0.55,
    goo: 1,
    stretch: 0.6,
    wobble: 1,
    drip: 0,
    shine: 1,
    splash: true,
    splashCount: 6,
    splashSpeed: 0.5,
    splashSize: 0.5,
    splashGravity: 0,
    regrow: 0.5,
    shadow: false,
    hideCursor: true,
  });

  const UNIT = { min: 0, max: 1, step: 0.05 };

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'material', {
      options: { Chrome: 'chrome', Jelly: 'jelly', Pearl: 'pearl', Ink: 'ink' },
    });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'blend', {
      options: {
        Normal: 'normal',
        Difference: 'difference',
        Exclusion: 'exclusion',
        Multiply: 'multiply',
        Screen: 'screen',
        Overlay: 'overlay',
      },
    });
    pane.addBinding(params, 'size', { min: 24, max: 240, step: 2 });
    pane.addBinding(params, 'morph', UNIT);
    pane.addBinding(params, 'morphSpeed', UNIT);
    pane.addBinding(params, 'depth', UNIT);
    pane.addBinding(params, 'trail', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'lag', UNIT);
    pane.addBinding(params, 'goo', UNIT);
    pane.addBinding(params, 'stretch', UNIT);
    pane.addBinding(params, 'wobble', UNIT);
    pane.addBinding(params, 'drip', UNIT);
    pane.addBinding(params, 'shine', UNIT);
    pane.addBinding(params, 'splash');
    pane.addBinding(params, 'splashCount', { min: 1, max: 32, step: 1 });
    pane.addBinding(params, 'splashSpeed', UNIT);
    pane.addBinding(params, 'splashSize', UNIT);
    pane.addBinding(params, 'splashGravity', UNIT);
    pane.addBinding(params, 'regrow', UNIT);
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'hideCursor');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BlobCursor from '~/components/ui/blob-cursor/BlobCursor.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <BlobCursor
      material=&quot;chrome&quot;
      color=&quot;#3B82F6&quot;
      :size=&quot;140&quot;
      :trail=&quot;16&quot;
      :lag=&quot;0.55&quot;
      :stretch=&quot;0.6&quot;
      :drip=&quot;0&quot;
      splash
      :splash-count=&quot;6&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <div class="absolute inset-0">
        <p
          class="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-muted-foreground select-none"
        >
          Move and click
        </p>
        <BlobCursor
          class="absolute inset-0 size-full"
          :material="params.material"
          :color="params.color"
          :blend="params.blend"
          :size="params.size"
          :morph="params.morph"
          :morph-speed="params.morphSpeed"
          :depth="params.depth"
          :trail="params.trail"
          :lag="params.lag"
          :goo="params.goo"
          :stretch="params.stretch"
          :wobble="params.wobble"
          :drip="params.drip"
          :shine="params.shine"
          :splash="params.splash"
          :splash-count="params.splashCount"
          :splash-speed="params.splashSpeed"
          :splash-size="params.splashSize"
          :splash-gravity="params.splashGravity"
          :regrow="params.regrow"
          :shadow="params.shadow"
          :hide-cursor="params.hideCursor"
        />
      </div>
      <ShaderPane title="Blob Cursor" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
