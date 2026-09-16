<script setup lang="ts">
  import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';
  import type { HoloStickerProps, StickerSettings } from './types';
  import { defaultSettings } from './sticker-settings';
  import { HoloRenderer } from './holo-renderer';
  import { loadImageSource } from './load-image';

  const props = withDefaults(defineProps<HoloStickerProps>(), {
    src: '',
    settings: undefined,
    tiltLocked: false,
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const renderer = shallowRef<HoloRenderer | null>(null);
  const loading = ref(true);
  const failed = ref(false);
  const imgAspect = ref(1);

  const bgClass =
    (props.settings?.background ?? defaultSettings.background) === 'white'
      ? 'bg-white'
      : (props.settings?.background ?? defaultSettings.background) === 'black'
        ? 'bg-black'
        : 'bg-[length:24px_24px] bg-[image:repeating-conic-gradient(oklch(0.94_0_0)_0%_25%,white_0%_50%)] dark:bg-[image:repeating-conic-gradient(oklch(0.24_0_0)_0%_25%,oklch(0.2_0_0)_0%_50%)]';

  let raf = 0;
  let disposed = false;

  async function loadSrc() {
    if (!props.src || disposed) {
      renderer.value?.setImage(null);
      loading.value = !props.src;
      return;
    }
    loading.value = true;
    failed.value = false;
    try {
      const { bitmap, aspect } = await loadImageSource(props.src);
      if (disposed) return;
      renderer.value?.setImage(bitmap);
      imgAspect.value = aspect;
      renderer.value?.render({
        settings: mergedSettings(),
        imgAspect: aspect,
      });
    } catch {
      if (!disposed) failed.value = true;
    } finally {
      if (!disposed) loading.value = false;
    }
  }

  function mergedSettings(): StickerSettings {
    return { ...defaultSettings, ...props.settings };
  }

  function draw() {
    if (!renderer.value || disposed) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
    }
    renderer.value.render({
      settings: mergedSettings(),
      imgAspect: imgAspect.value,
    });
    raf = requestAnimationFrame(draw);
  }

  function onPointerMove(e: PointerEvent) {
    if (props.tiltLocked || !renderer.value || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    renderer.value.setTilt(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((e.clientY - rect.top) / rect.height) * 2,
    );
  }

  onMounted(() => {
    if (!canvasRef.value) return;
    renderer.value = new HoloRenderer(canvasRef.value);
    draw();
    void loadSrc();
  });
  onBeforeUnmount(() => {
    disposed = true;
    cancelAnimationFrame(raf);
    renderer.value?.dispose();
    renderer.value = null;
  });

  watch(
    [() => props.src, () => props.settings, () => props.tiltLocked],
    () => {
      if (props.src) void loadSrc();
    },
    { deep: true },
  );
</script>

<template>
  <div :class="cn('relative size-full overflow-hidden', bgClass, props.class)">
    <canvas
      ref="canvasRef"
      class="size-full touch-none"
      @pointermove="onPointerMove"
    />
    <div
      v-if="loading"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground"
    >
      <p class="text-sm font-medium">Loading artwork…</p>
    </div>
    <div
      v-else-if="failed"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground"
    >
      <p class="text-sm font-medium">Could not load artwork</p>
    </div>
  </div>
</template>
