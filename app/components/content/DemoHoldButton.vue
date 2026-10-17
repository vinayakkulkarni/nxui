<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import HoldButton from '@registry/new-york/hold-button/HoldButton.vue';
  import type { Pane } from 'tweakpane';
  import type {
    HoldButtonDirection,
    HoldButtonSize,
  } from '@registry/new-york/hold-button/types';

  const DEFAULT_BG = '#27272a';
  const DEFAULT_TEXT = '#f5f5f5';

  const ACTIONS = {
    delete: {
      label: 'Hold to delete',
      done: 'Deleted',
      icon: 'lucide:trash-2',
    },
    send: { label: 'Hold to send', done: 'Sent', icon: 'lucide:send' },
    pay: { label: 'Hold to pay', done: 'Paid', icon: 'lucide:credit-card' },
    signout: {
      label: 'Hold to sign out',
      done: 'Signed out',
      icon: 'lucide:log-out',
    },
  };

  const DEFAULT_SIZE: HoldButtonSize = 'md';
  const DEFAULT_DIRECTION: HoldButtonDirection = 'right';

  const colorMode = useColorMode();

  const params = reactive({
    action: 'delete',
    fillColor: '#5227FF',
    backgroundColor: DEFAULT_BG,
    textColor: DEFAULT_TEXT,
    fillTextColor: '#ffffff',
    size: DEFAULT_SIZE,
    radius: 14,
    fillDirection: DEFAULT_DIRECTION,
    holdTime: 2000,
    releaseTime: 200,
    pressScale: 0.97,
    wave: true,
    waveAmplitude: 6,
    glow: true,
    resetAfter: 1200,
    disabled: false,
  });

  const holds = ref(0);
  const taps = ref(0);

  const current = computed(() => {
    if (params.action === 'send') return ACTIONS.send;
    if (params.action === 'pay') return ACTIONS.pay;
    if (params.action === 'signout') return ACTIONS.signout;
    return ACTIONS.delete;
  });

  const isLight = computed(() => colorMode.value !== 'dark');
  const renderedBackground = computed(() =>
    isLight.value && params.backgroundColor === DEFAULT_BG
      ? '#f6f6f6'
      : params.backgroundColor,
  );
  const renderedText = computed(() =>
    isLight.value && params.textColor === DEFAULT_TEXT
      ? '#333333'
      : params.textColor,
  );
  const buttonKey = computed(() => `${params.action}-${params.fillDirection}`);

  function onHold() {
    holds.value += 1;
  }

  function onTap() {
    taps.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'action', {
      options: {
        Delete: 'delete',
        Send: 'send',
        Pay: 'pay',
        'Sign out': 'signout',
      },
    });
    pane.addBinding(params, 'fillColor', { label: 'fill' });
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'fillTextColor', { label: 'text on fill' });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'fillDirection', {
      label: 'direction',
      options: { Right: 'right', Up: 'up' },
    });
    pane.addBinding(params, 'holdTime', { min: 600, max: 4000, step: 100 });
    pane.addBinding(params, 'releaseTime', { min: 100, max: 400, step: 10 });
    pane.addBinding(params, 'pressScale', { min: 0.9, max: 1, step: 0.005 });
    pane.addBinding(params, 'wave');
    pane.addBinding(params, 'waveAmplitude', {
      label: 'wave size',
      min: 2,
      max: 14,
      step: 1,
    });
    pane.addBinding(params, 'glow');
    pane.addBinding(params, 'resetAfter', { min: 0, max: 3000, step: 100 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import HoldButton from '~/components/ui/hold-button/HoldButton.vue';

  function onHold() {
    console.log('confirmed');
  }
</script>

<template>
  <HoldButton
    icon=&quot;lucide:trash-2&quot;
    done-icon=&quot;lucide:check&quot;
    done-label=&quot;Deleted&quot;
    fill-color=&quot;#5227FF&quot;
    :hold-time=&quot;2000&quot;
    @hold=&quot;onHold&quot;
  >
    Hold to delete
  </HoldButton>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <HoldButton
        :key="buttonKey"
        :done-label="current.done"
        :icon="current.icon"
        done-icon="lucide:check"
        :background-color="renderedBackground"
        :fill-color="params.fillColor"
        :text-color="renderedText"
        :fill-text-color="params.fillTextColor"
        :size="params.size"
        :radius="params.radius"
        :fill-direction="params.fillDirection"
        :hold-time="params.holdTime"
        :release-time="params.releaseTime"
        :press-scale="params.pressScale"
        :wave="params.wave"
        :wave-amplitude="params.waveAmplitude"
        :glow="params.glow"
        :reset-after="params.resetAfter"
        :disabled="params.disabled"
        @hold="onHold"
        @tap="onTap"
      >
        {{ current.label }}
      </HoldButton>
      <p class="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        confirmed {{ holds }} · tapped {{ taps }}
      </p>
      <ShaderPane title="Hold Button" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
