<script setup lang="ts">
  import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
  import type {
    DepthDiveConfig,
    DepthDiveHandle,
    DepthDiveProps,
  } from './types';
  import { DEFAULT_TEXT } from './dive-text';
  import { createDepthDive } from './dive-engine';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<DepthDiveProps>(), {
    text: DEFAULT_TEXT,
    uppercase: false,
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    fontSize: 64,
    headingSize: 22,
    lineHeight: 1.12,
    letterSpacing: -0.02,
    sideMargin: 0.09,
    fov: 85,
    layerGap: 14.5,
    fill: 0.78,
    scatter: 0,
    tilt: 0,
    sway: 0.7,
    warp: 4,
    scrollSpeed: 1,
    damping: 0.43,
    autoScroll: 0.02,
    infinite: true,
    fogFar: 2.2,
    fogNear: 1.2,
    dissolveStart: 1.2,
    depthTint: 0.25,
    rgbShift: 0,
    rgbShiftVel: 0,
    rgbShiftWarmth: 0,
    wobble: 0,
    tunnel: 0,
    tunnelTwist: 0,
    tunnelSpeed: 0,
    psychedelia: 0,
    hueDrift: 0,
    stars: 0,
    streaks: 0,
    grain: 0.34,
    vignette: 0.25,
    scanlines: 0.48,
    textColor: '#ffffff',
    headingColor: '#ff6a2b',
    bgColor: '#05030a',
    accentColor: '#ff5c1f',
    accentColor2: '#7b5cff',
    showHud: true,
    hudTitle: 'MANIFESTO',
    renderScale: 1.5,
    class: '',
  });

  const containerRef = ref<HTMLElement | null>(null);
  const counterRef = ref<HTMLElement | null>(null);
  const hintRef = ref<HTMLElement | null>(null);
  const barRef = ref<HTMLElement | null>(null);
  const engine = shallowRef<DepthDiveHandle | null>(null);

  function currentConfig(): DepthDiveConfig {
    return {
      text: props.text,
      uppercase: props.uppercase,
      fontFamily: props.fontFamily,
      fontWeight: props.fontWeight,
      fontSize: props.fontSize,
      headingSize: props.headingSize,
      lineHeight: props.lineHeight,
      letterSpacing: props.letterSpacing,
      sideMargin: props.sideMargin,
      fov: props.fov,
      layerGap: props.layerGap,
      fill: props.fill,
      scatter: props.scatter,
      tilt: props.tilt,
      sway: props.sway,
      warp: props.warp,
      scrollSpeed: props.scrollSpeed,
      damping: props.damping,
      autoScroll: props.autoScroll,
      infinite: props.infinite,
      fogFar: props.fogFar,
      fogNear: props.fogNear,
      dissolveStart: props.dissolveStart,
      depthTint: props.depthTint,
      rgbShift: props.rgbShift,
      rgbShiftVel: props.rgbShiftVel,
      rgbShiftWarmth: props.rgbShiftWarmth,
      wobble: props.wobble,
      tunnel: props.tunnel,
      tunnelTwist: props.tunnelTwist,
      tunnelSpeed: props.tunnelSpeed,
      psychedelia: props.psychedelia,
      hueDrift: props.hueDrift,
      stars: props.stars,
      streaks: props.streaks,
      grain: props.grain,
      vignette: props.vignette,
      scanlines: props.scanlines,
      textColor: props.textColor,
      headingColor: props.headingColor,
      bgColor: props.bgColor,
      accentColor: props.accentColor,
      accentColor2: props.accentColor2,
      renderScale: props.renderScale,
    };
  }

  onMounted(() => {
    if (!containerRef.value) return;
    engine.value = createDepthDive(containerRef.value, {
      counter: counterRef.value,
      hint: hintRef.value,
      bar: barRef.value,
    });
    engine.value.sync(currentConfig());
  });

  onBeforeUnmount(() => {
    engine.value?.dispose();
    engine.value = null;
  });

  watch(
    () => currentConfig(),
    (cfg) => engine.value?.sync(cfg),
    { deep: true },
  );
</script>

<template>
  <div
    :class="cn('relative size-full overflow-hidden select-none', props.class)"
    :style="{ backgroundColor: bgColor }"
  >
    <div ref="containerRef" class="absolute inset-0"></div>
    <div
      v-if="showHud"
      class="pointer-events-none absolute inset-0 font-mono text-[10px] uppercase tracking-[0.2em]"
      :style="{ color: textColor, opacity: 0.55 }"
    >
      <span class="absolute right-4 top-3">{{ hudTitle }}</span>
      <span ref="counterRef" class="absolute bottom-3 left-4"></span>
      <span
        ref="hintRef"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 transition-opacity duration-700"
      >
        Scroll to dive
      </span>
      <div
        class="absolute right-4 top-1/2 h-24 w-px -translate-y-1/2"
        :style="{ backgroundColor: `${textColor}26` }"
      >
        <div
          ref="barRef"
          class="size-full origin-top"
          :style="{ backgroundColor: accentColor, transform: 'scaleY(0)' }"
        ></div>
      </div>
    </div>
  </div>
</template>
