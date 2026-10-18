<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import SlideCommit from '@registry/new-york/slide-commit/SlideCommit.vue';
  import type { Pane } from 'tweakpane';

  const DEFAULT_TRACK = '#262626';
  const DEFAULT_HANDLE = '#f5f5f5';

  const params = reactive({
    outcome: 'resolve',
    latency: 1200,
    label: 'Slide to pay',
    doneLabel: 'Paid',
    errorLabel: 'Payment failed',
    trackColor: DEFAULT_TRACK,
    handleColor: DEFAULT_HANDLE,
    successColor: '#22c55e',
    dangerColor: '#e5484d',
    width: 280,
    height: 56,
    radius: 28,
    speed: 50,
    returnBounce: 0.38,
    landingDip: 0.026,
    holdMs: 1500,
    disabled: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const track = computed(() =>
    isLight.value && params.trackColor === DEFAULT_TRACK
      ? '#f6f6f6'
      : params.trackColor,
  );
  const handle = computed(() =>
    isLight.value && params.handleColor === DEFAULT_HANDLE
      ? '#18181b'
      : params.handleColor,
  );

  function confirm(): Promise<void> | undefined {
    if (params.outcome === 'instant') return undefined;
    const fail = params.outcome === 'reject';
    const latency = params.latency;
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (fail) reject(new Error('Declined'));
        else resolve();
      }, latency);
    });
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'outcome', {
      options: { Resolve: 'resolve', Reject: 'reject', Instant: 'instant' },
    });
    pane.addBinding(params, 'latency', { min: 0, max: 3000, step: 100 });
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'doneLabel');
    pane.addBinding(params, 'errorLabel');
    pane.addBinding(params, 'trackColor');
    pane.addBinding(params, 'handleColor');
    pane.addBinding(params, 'successColor');
    pane.addBinding(params, 'dangerColor');
    pane.addBinding(params, 'width', { min: 220, max: 380, step: 4 });
    pane.addBinding(params, 'height', { min: 44, max: 72, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 36, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'returnBounce', { min: 0, max: 0.5, step: 0.02 });
    pane.addBinding(params, 'landingDip', { min: 0, max: 0.06, step: 0.002 });
    pane.addBinding(params, 'holdMs', { min: 500, max: 4000, step: 100 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SlideCommit from '~/components/ui/slide-commit/SlideCommit.vue';

  function pay() {
    return fetch('/api/pay', { method: 'POST' });
  }
</script>

<template>
  <SlideCommit
    label=&quot;Slide to pay&quot;
    done-label=&quot;Paid&quot;
    error-label=&quot;Payment failed&quot;
    :on-confirm=&quot;pay&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <SlideCommit
        :label="params.label"
        :done-label="params.doneLabel"
        :error-label="params.errorLabel"
        :on-confirm="confirm"
        :track-color="track"
        :handle-color="handle"
        :success-color="params.successColor"
        :danger-color="params.dangerColor"
        :width="params.width"
        :height="params.height"
        :radius="params.radius"
        :speed="params.speed"
        :return-bounce="params.returnBounce"
        :landing-dip="params.landingDip"
        :hold-ms="params.holdMs"
        :disabled="params.disabled"
      />
      <ShaderPane title="Slide Commit" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
