<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import FuseButton from '@registry/new-york/fuse-button/FuseButton.vue';
  import type { Pane } from 'tweakpane';
  import type {
    FuseButtonCommitOn,
    FuseButtonCommitReason,
    FuseButtonFuse,
    FuseButtonSettle,
    FuseButtonSize,
  } from '@registry/new-york/fuse-button/types';

  const DEFAULT_COLOR = '#f5f5f5';
  const DEFAULT_BG = '#27272a';
  const DEFAULT_FUSE = '#f5a524';
  const DEFAULT_SIZE: FuseButtonSize = 'md';
  const DEFAULT_FUSE_STYLE: FuseButtonFuse = 'outline';
  const DEFAULT_COMMIT: FuseButtonCommitOn = 'press';
  const DEFAULT_SETTLE: FuseButtonSettle = 'reset';

  const PRESETS = {
    archive: {
      label: 'Archive',
      undoLabel: 'Undo',
      doneLabel: 'Archived',
      icon: 'lucide:archive',
      fuse: '#f5a524',
    },
    send: {
      label: 'Send',
      undoLabel: 'Undo',
      doneLabel: 'Sent',
      icon: 'lucide:send',
      fuse: '#5b8def',
    },
    delete: {
      label: 'Delete',
      undoLabel: 'Undo',
      doneLabel: 'Deleted',
      icon: 'lucide:trash-2',
      fuse: '#e5484d',
    },
  };

  const colorMode = useColorMode();

  const params = reactive({
    preset: 'archive',
    color: DEFAULT_COLOR,
    background: DEFAULT_BG,
    fuseColor: DEFAULT_FUSE,
    size: DEFAULT_SIZE,
    radius: 22,
    undoWindow: 4000,
    fuse: DEFAULT_FUSE_STYLE,
    fuseThickness: 1.5,
    crossfadeMs: 200,
    commitOn: DEFAULT_COMMIT,
    pauseOnHover: true,
    settle: DEFAULT_SETTLE,
    disabled: false,
  });

  const log = ref('Click the button, then undo before the fuse burns out');

  const content = computed(() => {
    if (params.preset === 'send') return PRESETS.send;
    if (params.preset === 'delete') return PRESETS.delete;
    return PRESETS.archive;
  });
  const isLight = computed(() => colorMode.value !== 'dark');
  const renderedColor = computed(() =>
    isLight.value && params.color === DEFAULT_COLOR ? '#18181b' : params.color,
  );
  const renderedBackground = computed(() =>
    isLight.value && params.background === DEFAULT_BG
      ? '#f6f6f6'
      : params.background,
  );
  const renderedFuse = computed(() =>
    params.fuseColor === DEFAULT_FUSE ? content.value.fuse : params.fuseColor,
  );

  function onCommit(reason: FuseButtonCommitReason) {
    log.value = `commit (${reason === 'press' ? 'on press' : 'fuse ended'})`;
  }

  function onUndo() {
    log.value = 'undone';
  }

  function onFuseEnd() {
    log.value = 'fuse burned out';
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'preset', {
      options: { Archive: 'archive', Send: 'send', Delete: 'delete' },
    });
    pane.addBinding(params, 'color', { label: 'text' });
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'fuseColor', { label: 'fuse color' });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 26, step: 1 });
    pane.addBinding(params, 'undoWindow', { min: 1000, max: 10000, step: 500 });
    pane.addBinding(params, 'fuse', {
      options: { Outline: 'outline', Bottom: 'bottom', Top: 'top' },
    });
    pane.addBinding(params, 'fuseThickness', { min: 1, max: 4, step: 0.5 });
    pane.addBinding(params, 'crossfadeMs', {
      label: 'crossfade',
      min: 100,
      max: 300,
      step: 10,
    });
    pane.addBinding(params, 'commitOn', {
      options: { 'On press': 'press', 'When fuse ends': 'fuseEnd' },
    });
    pane.addBinding(params, 'settle', {
      label: 'after fuse',
      options: { Reset: 'reset', 'Stay done': 'stay' },
    });
    pane.addBinding(params, 'pauseOnHover');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FuseButton from '~/components/ui/fuse-button/FuseButton.vue';

  function archive() {
    console.log('archived');
  }

  function restore() {
    console.log('restored');
  }
</script>

<template>
  <FuseButton
    label=&quot;Archive&quot;
    done-label=&quot;Archived&quot;
    icon=&quot;lucide:archive&quot;
    fuse-color=&quot;#f5a524&quot;
    :undo-window=&quot;4000&quot;
    @commit=&quot;archive&quot;
    @undo=&quot;restore&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <FuseButton
        :key="params.preset"
        :label="content.label"
        :undo-label="content.undoLabel"
        :done-label="content.doneLabel"
        :icon="content.icon"
        :color="renderedColor"
        :background="renderedBackground"
        :fuse-color="renderedFuse"
        :size="params.size"
        :radius="params.radius"
        :undo-window="params.undoWindow"
        :fuse="params.fuse"
        :fuse-thickness="params.fuseThickness"
        :crossfade-ms="params.crossfadeMs"
        :commit-on="params.commitOn"
        :pause-on-hover="params.pauseOnHover"
        :settle="params.settle"
        :disabled="params.disabled"
        @commit="onCommit"
        @undo="onUndo"
        @fuse-end="onFuseEnd"
      />
      <p class="text-xs text-muted-foreground" aria-hidden="true">{{ log }}</p>
      <ShaderPane title="Fuse Button" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
