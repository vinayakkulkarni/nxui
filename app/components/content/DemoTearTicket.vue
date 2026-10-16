<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import TearTicket from '@registry/new-york/tear-ticket/TearTicket.vue';
  import type { Pane } from 'tweakpane';
  import type { TearTicketOrientation } from '@registry/new-york/tear-ticket/types';

  const IMAGE =
    'https://images.unsplash.com/photo-1604852961945-155837ffebe2?q=80&w=1200&auto=format&fit=crop';
  const DARK_BG = '#27272a';
  const DARK_INK = '#f5f5f5';
  const orientation = ref<TearTicketOrientation>('horizontal');

  const SIZES: Record<
    TearTicketOrientation,
    { width: number; height: number; stubSize: number }
  > = {
    horizontal: { width: 460, height: 250, stubSize: 150 },
    vertical: { width: 300, height: 440, stubSize: 130 },
  };

  const params = reactive({
    orientation,
    scrim: false,
    width: 460,
    height: 250,
    stubSize: 150,
    radius: 16,
    holes: 12,
    holeSize: 6,
    notch: 3,
    roughness: 0,
    tearAngle: 30,
    stretch: 30,
    resistance: 0.45,
    rotate: 4,
    tilt: true,
    tiltMax: 9,
    tiltReach: 260,
    parallax: 6,
    perspective: 1000,
    background: DARK_BG,
    color: DARK_INK,
    border: true,
    borderWidth: 1,
    recenter: true,
    disabled: false,
  });

  const run = ref(0);
  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const renderedBackground = computed(() =>
    isLight.value && params.background === DARK_BG
      ? '#f6f6f6'
      : params.background,
  );
  const renderedColor = computed(() =>
    isLight.value && params.color === DARK_INK ? '#18181b' : params.color,
  );
  const imageRadius = computed(() => Math.max(0, params.radius - 8));
  const isVertical = computed(() => params.orientation === 'vertical');

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'orientation', {
        options: { Horizontal: 'horizontal', Vertical: 'vertical' },
      })
      .on('change', (ev) => {
        const size = SIZES[ev.value];
        params.width = size.width;
        params.height = size.height;
        params.stubSize = size.stubSize;
        pane.refresh();
        run.value += 1;
      });
    pane.addBinding(params, 'scrim');
    pane.addBinding(params, 'width', { min: 220, max: 560, step: 10 });
    pane.addBinding(params, 'height', { min: 140, max: 460, step: 10 });
    pane.addBinding(params, 'stubSize', { min: 70, max: 180, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'holes', { min: 6, max: 44, step: 1 });
    pane.addBinding(params, 'holeSize', { min: 1, max: 8, step: 0.2 });
    pane.addBinding(params, 'notch', { min: 0, max: 16, step: 1 });
    pane.addBinding(params, 'roughness', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'tearAngle', { min: 12, max: 60, step: 1 });
    pane.addBinding(params, 'stretch', { min: 2, max: 60, step: 1 });
    pane.addBinding(params, 'resistance', { min: 0, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'rotate', { min: -20, max: 20, step: 1 });
    pane.addBinding(params, 'tilt');
    pane.addBinding(params, 'tiltMax', { min: 0, max: 24, step: 1 });
    pane.addBinding(params, 'tiltReach', { min: 0, max: 700, step: 20 });
    pane.addBinding(params, 'parallax', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'perspective', { min: 400, max: 2400, step: 50 });
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'border');
    pane.addBinding(params, 'borderWidth', { min: 0.5, max: 4, step: 0.5 });
    pane.addBinding(params, 'recenter');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TearTicket from '~/components/ui/tear-ticket/TearTicket.vue';
</script>

<template>
  <TearTicket
    image=&quot;https://images.unsplash.com/photo-1604852961945-155837ffebe2?w=1200&quot;
    image-alt=&quot;Visitors in a walkway of coloured glass&quot;
    :scrim=&quot;false&quot;
    :image-radius=&quot;8&quot;
    :tear-angle=&quot;30&quot;
    :stretch=&quot;30&quot;
    :resistance=&quot;0.45&quot;
    @tear=&quot;console.log('used')&quot;
  >
    <div
      class=&quot;flex h-full items-center justify-between px-6&quot;
      style=&quot;padding-top: calc(var(--tt-body-h) * var(--tt-span) - var(--tt-inset))&quot;
    >
      <span class=&quot;text-[15px] font-medium&quot;>Spectrum</span>
      <span class=&quot;text-[13px] opacity-45&quot;>14 Nov</span>
    </div>
    <template #stub>
      <div class=&quot;relative h-full px-5 pt-7.5 pl-6.5&quot;>
        <p class=&quot;text-[17px] font-medium&quot;>Admit one</p>
        <p class=&quot;mt-2 text-xs opacity-50&quot;>Rooftop gallery<br />Until 30 Nov</p>
        <span class=&quot;absolute bottom-7.5 left-6.5 text-[13px] opacity-45&quot;>No. 284619</span>
      </div>
    </template>
  </TearTicket>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 tt-stage"
    >
      <TearTicket
        :key="run"
        :image="IMAGE"
        image-alt="Visitors in a walkway of coloured glass"
        :orientation="params.orientation"
        :scrim="params.scrim"
        :image-radius="imageRadius"
        :width="params.width"
        :height="params.height"
        :stub-size="params.stubSize"
        :radius="params.radius"
        :holes="params.holes"
        :hole-size="params.holeSize"
        :notch="params.notch"
        :roughness="params.roughness"
        :tear-angle="params.tearAngle"
        :stretch="params.stretch"
        :resistance="params.resistance"
        :rotate="params.rotate"
        :tilt="params.tilt"
        :tilt-max="params.tiltMax"
        :tilt-reach="params.tiltReach"
        :parallax="params.parallax"
        :perspective="params.perspective"
        :background="renderedBackground"
        :color="renderedColor"
        :border="params.border"
        :border-width="params.borderWidth"
        :recenter="params.recenter"
        :disabled="params.disabled"
      >
        <div class="tt-face">
          <span class="tt-title">Spectrum</span>
          <span class="tt-meta">14 Nov</span>
        </div>
        <template #stub>
          <div v-if="isVertical" class="tt-stub-v">
            <span class="tt-head">Admit one</span>
            <div class="tt-row">
              <span class="tt-note">Rooftop gallery · Until 30 Nov</span>
              <span class="tt-meta tt-num">No. 284619</span>
            </div>
          </div>
          <div v-else class="tt-stub-h">
            <div class="tt-details">
              <span class="tt-head">Admit one</span>
              <span class="tt-note">
                Rooftop gallery
                <br />
                Until 30 Nov
              </span>
            </div>
            <span class="tt-meta tt-num tt-serial">No. 284619</span>
          </div>
        </template>
      </TearTicket>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        drag the stub away to tear it · Enter tears it from the keyboard
      </p>
      <ShaderPane title="Tear Ticket" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  @media (min-width: 1024px) {
    .tt-stage {
      padding-right: 20rem;
    }
  }

  .tt-face {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    height: 100%;
    padding: calc(var(--tt-body-h) * var(--tt-span) - var(--tt-inset)) 24px 0;
    box-sizing: border-box;
  }

  .tt-title {
    font-size: 15px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  .tt-head {
    font-size: 17px;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .tt-meta {
    font-size: 13px;
    line-height: 1;
    opacity: 0.45;
  }

  .tt-num {
    font-variant-numeric: tabular-nums;
  }

  .tt-note {
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.55;
    opacity: 0.5;
  }

  .tt-stub-h {
    position: relative;
    height: 100%;
    text-align: left;
  }

  .tt-details {
    display: flex;
    flex-direction: column;
    padding: 30px 20px 0 26px;
  }

  .tt-serial {
    position: absolute;
    bottom: 30px;
    left: 26px;
  }

  .tt-stub-v {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 32px 24px 30px;
    box-sizing: border-box;
    text-align: left;
  }

  .tt-stub-v .tt-head {
    line-height: 1;
  }

  .tt-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
  }

  .tt-row .tt-note {
    margin-top: 0;
    line-height: 1;
  }
</style>
