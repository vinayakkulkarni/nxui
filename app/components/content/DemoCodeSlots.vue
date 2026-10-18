<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from 'vue';
  import CodeSlots from '@registry/new-york/code-slots/CodeSlots.vue';
  import type { CodeSlotsStatus } from '@registry/new-york/code-slots/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_ACCENT = '#f5f5f5';
  const DEFAULT_INK = '#f5f5f5';
  const DEFAULT_SLOT = '#27272a';
  const DEFAULT_DIGIT = '#18181b';

  const params = reactive({
    accentColor: DEFAULT_ACCENT,
    inkColor: DEFAULT_INK,
    slotColor: DEFAULT_SLOT,
    digitColor: DEFAULT_DIGIT,
    dangerColor: '#ff3b30',
    length: 6,
    mask: false,
    caret: true,
    outcome: 'accept',
    slotSize: 44,
    gap: 8,
    radius: 12,
    bounce: 0.2,
    settle: 0.3,
    rise: 8,
    cascade: 20,
    disabled: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const accent = computed(() =>
    isLight.value && params.accentColor === DEFAULT_ACCENT
      ? '#18181b'
      : params.accentColor,
  );
  const ink = computed(() =>
    isLight.value && params.inkColor === DEFAULT_INK
      ? '#18181b'
      : params.inkColor,
  );
  const slot = computed(() =>
    isLight.value && params.slotColor === DEFAULT_SLOT
      ? '#f6f6f6'
      : params.slotColor,
  );
  const digit = computed(() =>
    isLight.value && params.digitColor === DEFAULT_DIGIT
      ? '#ffffff'
      : params.digitColor,
  );

  const value = ref('');
  const status = ref<CodeSlotsStatus>('idle');
  const timers: ReturnType<typeof setTimeout>[] = [];
  function later(fn: () => void, ms: number) {
    timers.push(setTimeout(fn, ms));
  }
  onBeforeUnmount(() => timers.forEach(clearTimeout));

  function onChange() {
    status.value = 'idle';
  }
  function onComplete() {
    later(() => {
      if (params.outcome === 'reject') {
        status.value = 'error';
        return;
      }
      status.value = 'success';
      later(() => {
        value.value = '';
        status.value = 'idle';
      }, 1800);
    }, 350);
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'inkColor', { label: 'ink' });
    pane.addBinding(params, 'slotColor', { label: 'slot' });
    pane.addBinding(params, 'digitColor', { label: 'digit' });
    pane.addBinding(params, 'dangerColor', { label: 'danger' });
    pane.addBinding(params, 'length', { min: 4, max: 8, step: 1 });
    pane.addBinding(params, 'mask');
    pane.addBinding(params, 'caret');
    pane.addBinding(params, 'outcome', {
      options: { Accept: 'accept', Reject: 'reject' },
    });
    pane.addBinding(params, 'slotSize', { min: 36, max: 64, step: 2 });
    pane.addBinding(params, 'gap', { min: 4, max: 16, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.3, step: 0.05 });
    pane.addBinding(params, 'settle', { min: 0.2, max: 0.5, step: 0.05 });
    pane.addBinding(params, 'rise', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'cascade', { min: 0, max: 60, step: 5 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CodeSlots from '~/components/ui/code-slots/CodeSlots.vue';
  import type { CodeSlotsStatus } from '~/components/ui/code-slots/types';

  const code = ref('');
  const status = ref<CodeSlotsStatus>('idle');

  async function verify(value: string) {
    const ok = await fetch('/api/verify', {
      method: 'POST',
      body: value,
    }).then((r) => r.ok);
    status.value = ok ? 'success' : 'error';
  }
</script>

<template>
  <CodeSlots
    v-model=&quot;code&quot;
    :length=&quot;6&quot;
    :status=&quot;status&quot;
    accent-color=&quot;#f5f5f5&quot;
    slot-color=&quot;#27272a&quot;
    digit-color=&quot;#18181b&quot;
    @change=&quot;status = 'idle'&quot;
    @complete=&quot;verify&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <CodeSlots
        v-model="value"
        :status="status"
        :length="params.length"
        :mask="params.mask"
        :caret="params.caret"
        :disabled="params.disabled"
        :accent-color="accent"
        :ink-color="ink"
        :slot-color="slot"
        :digit-color="digit"
        :danger-color="params.dangerColor"
        :slot-size="params.slotSize"
        :gap="params.gap"
        :radius="params.radius"
        :bounce="params.bounce"
        :settle="params.settle"
        :rise="params.rise"
        :cascade="params.cascade"
        @change="onChange"
        @complete="onComplete"
      />
      <ShaderPane title="Code Slots" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
