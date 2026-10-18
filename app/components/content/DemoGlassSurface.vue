<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import GlassSurface from '@registry/new-york/glass-surface/GlassSurface.vue';
  import type { Pane } from 'tweakpane';
  import type { GlassSurfaceProps } from '@registry/new-york/glass-surface/types';

  const DAY_SKY =
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=1800&auto=format&fit=crop&q=80';
  const NIGHT_SKY =
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1800&auto=format&fit=crop&q=80';

  // nxui "n" mark as a solid outline the glass can take the shape of.
  const NXUI_MARK = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="4 4 24 24"><path d="M10.5 23.5V11m0 4.5a5.5 5.5 0 0 1 11 0v8" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  )}`;

  const LOOK: GlassSurfaceProps = {
    borderWidth: 0.07,
    brightness: 50,
    opacity: 0.93,
    blur: 11,
    displace: 0.5,
    backgroundOpacity: 0.1,
    saturation: 1,
    distortionScale: -180,
    redOffset: 0,
    greenOffset: 10,
    blueOffset: 20,
  };

  const PRESETS: Record<string, GlassSurfaceProps> = {
    tabs: { ...LOOK, width: 320, height: 76, borderRadius: 38 },
    lens: {
      ...LOOK,
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 0.12,
      distortionScale: -240,
    },
    player: { ...LOOK, width: 260, height: 96, borderRadius: 30 },
    prism: {
      ...LOOK,
      width: 320,
      height: 76,
      borderRadius: 38,
      distortionScale: -220,
      greenOffset: 28,
      blueOffset: 56,
    },
    frost: {
      ...LOOK,
      width: 320,
      height: 76,
      borderRadius: 38,
      displace: 3,
      backgroundOpacity: 0.28,
    },
    logo: { ...LOOK, width: 280, height: 280, borderRadius: 38 },
  };

  const NAV_ICONS = [
    'lucide:house',
    'lucide:search',
    'lucide:heart',
    'lucide:user',
  ];
  const PLAYER_ICONS = [
    'lucide:skip-back',
    'lucide:pause',
    'lucide:skip-forward',
  ];
  const NO_ICONS: string[] = [];
  const DRIFT_X = 24;
  const DRIFT_Y = 16;

  const params = reactive({
    preset: 'tabs',
    renderer: 'auto',
    width: 320,
    height: 76,
    borderRadius: 38,
    distortionScale: -180,
    borderWidth: 0.07,
    blur: 11,
    brightness: 50,
    opacity: 0.93,
    displace: 0.5,
    redOffset: 0,
    greenOffset: 10,
    blueOffset: 20,
    backgroundOpacity: 0.1,
    saturation: 1,
  });

  const colorMode = useColorMode();
  const reducedMotion = usePreferredReducedMotion();

  const stageRef = ref<HTMLElement | null>(null);
  const backdropRef = ref<HTMLImageElement | null>(null);
  const glassRef = ref<HTMLElement | null>(null);
  const fileRef = ref<HTMLInputElement | null>(null);
  const stageWidth = ref(0);
  const upload = ref<{ url: string; name: string } | null>(null);

  const offset = { x: 0, y: 0 };
  const shown = { x: 0, y: 0 };
  let grab: {
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
  } | null = null;
  const drift = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, time: 0, frame: 0 };

  const sky = computed(() =>
    colorMode.value === 'dark' ? NIGHT_SKY : DAY_SKY,
  );
  const iconColor = computed(() =>
    colorMode.value === 'dark' ? 'text-white' : 'text-zinc-900',
  );
  const icons = computed(() => {
    if (params.preset === 'player') return PLAYER_ICONS;
    if (params.preset === 'lens' || params.preset === 'logo') return NO_ICONS;
    return NAV_ICONS;
  });
  const shape = computed(() =>
    params.preset === 'logo' ? (upload.value?.url ?? NXUI_MARK) : undefined,
  );
  const glassWidth = computed(() =>
    stageWidth.value
      ? Math.min(params.width, stageWidth.value - 32)
      : params.width,
  );
  const refraction = computed(() => params.renderer !== 'frosted');
  const renderer = computed(() =>
    params.renderer === 'svg' || params.renderer === 'webgl'
      ? params.renderer
      : 'auto',
  );

  function place() {
    const stage = stageRef.value;
    const glass = glassRef.value;
    if (!stage || !glass) return;
    const ratio = window.devicePixelRatio || 1;
    const limitX = Math.max(
      0,
      (stage.clientWidth - glass.offsetWidth) / 2 - 16,
    );
    const limitY = Math.max(
      0,
      (stage.clientHeight - glass.offsetHeight) / 2 - 16,
    );
    const leanX = drift.x * DRIFT_X;
    const leanY = drift.y * DRIFT_Y;
    const x = Math.min(
      limitX,
      Math.max(-limitX, grab ? grab.pointerX - grab.x : offset.x + leanX),
    );
    const y = Math.min(
      limitY,
      Math.max(-limitY, grab ? grab.pointerY - grab.y : offset.y + leanY),
    );
    if (grab) {
      offset.x = x - leanX;
      offset.y = y - leanY;
    }
    shown.x = x;
    shown.y = y;
    glass.style.transform = `translate(${Math.round(x * ratio) / ratio}px, ${Math.round(y * ratio) / ratio}px)`;
  }

  function step(now: number) {
    const dt = Math.min(0.05, (now - drift.time) / 1000);
    drift.time = now;
    drift.vx += (50 * (drift.tx - drift.x) - 14 * drift.vx) * dt;
    drift.vy += (50 * (drift.ty - drift.y) - 14 * drift.vy) * dt;
    drift.x += drift.vx * dt;
    drift.y += drift.vy * dt;
    const resting =
      Math.abs(drift.tx - drift.x) +
        Math.abs(drift.ty - drift.y) +
        Math.abs(drift.vx) +
        Math.abs(drift.vy) <
      0.0005;
    if (resting) {
      drift.x = drift.tx;
      drift.y = drift.ty;
      drift.vx = 0;
      drift.vy = 0;
    }
    place();
    drift.frame = resting ? 0 : requestAnimationFrame(step);
  }

  function wake() {
    if (drift.frame) return;
    drift.time = performance.now();
    drift.frame = requestAnimationFrame(step);
  }

  function onStageMove(event: PointerEvent) {
    const stage = stageRef.value;
    if (grab) {
      grab.pointerX = event.clientX;
      grab.pointerY = event.clientY;
      place();
    }
    if (stage && reducedMotion.value !== 'reduce') {
      const rect = stage.getBoundingClientRect();
      drift.tx = Math.min(
        1,
        Math.max(-1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      drift.ty = Math.min(
        1,
        Math.max(-1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      wake();
    }
  }

  function onStageLeave() {
    drift.tx = 0;
    drift.ty = 0;
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const target = glassRef.value;
    if (!target) return;
    target.setPointerCapture(event.pointerId);
    grab = {
      x: event.clientX - shown.x,
      y: event.clientY - shown.y,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
    target.style.cursor = 'grabbing';
  }

  function onPointerUp() {
    grab = null;
    if (glassRef.value) glassRef.value.style.cursor = 'grab';
  }

  function onFile() {
    const input = fileRef.value;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file) return;
    if (upload.value) URL.revokeObjectURL(upload.value.url);
    upload.value = { url: URL.createObjectURL(file), name: file.name };
  }

  function applyPreset(pane: Pane) {
    const preset = PRESETS[params.preset];
    if (!preset) return;
    Object.assign(params, preset);
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          'Tab Bar': 'tabs',
          Lens: 'lens',
          Player: 'player',
          Prism: 'prism',
          Frost: 'frost',
          Logo: 'logo',
        },
      })
      .on('change', () => {
        applyPreset(pane);
      });
    pane.addButton({ title: 'Upload logo (SVG/PNG)' }).on('click', () => {
      params.preset = 'logo';
      applyPreset(pane);
      fileRef.value?.click();
    });
    pane.addBinding(params, 'renderer', {
      options: { Auto: 'auto', SVG: 'svg', WebGL: 'webgl', Frosted: 'frosted' },
    });
    pane.addBinding(params, 'width', { min: 120, max: 600, step: 2 });
    pane.addBinding(params, 'height', { min: 48, max: 320, step: 2 });
    pane.addBinding(params, 'borderRadius', { min: 0, max: 160, step: 1 });
    pane.addBinding(params, 'distortionScale', {
      min: -300,
      max: 300,
      step: 10,
    });
    pane.addBinding(params, 'borderWidth', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'brightness', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'displace', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'redOffset', { min: -50, max: 50, step: 1 });
    pane.addBinding(params, 'greenOffset', { min: -50, max: 50, step: 1 });
    pane.addBinding(params, 'blueOffset', { min: -50, max: 50, step: 1 });
    pane.addBinding(params, 'backgroundOpacity', {
      min: 0,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'saturation', { min: 0, max: 3, step: 0.1 });
  }

  useResizeObserver(stageRef, () => {
    stageWidth.value = stageRef.value?.clientWidth ?? 0;
    place();
  });

  watch([() => params.width, () => params.height, () => params.preset], place, {
    flush: 'post',
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(drift.frame);
    drift.frame = 0;
    if (upload.value) URL.revokeObjectURL(upload.value.url);
  });
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import GlassSurface from '~/components/ui/glass-surface/GlassSurface.vue';

  const sky = ref<HTMLImageElement | null>(null);
</script>

<template>
  <div class=&quot;relative flex h-125 items-center justify-center overflow-hidden&quot;>
    <img
      ref=&quot;sky&quot;
      src=&quot;/sky.webp&quot;
      alt=&quot;&quot;
      crossorigin=&quot;anonymous&quot;
      class=&quot;absolute inset-0 size-full object-cover&quot;
    />
    <GlassSurface
      :width=&quot;320&quot;
      :height=&quot;76&quot;
      :border-radius=&quot;38&quot;
      :displace=&quot;0.5&quot;
      :background-opacity=&quot;0.1&quot;
      :backdrop=&quot;sky&quot;
    >
      <Icon name=&quot;lucide:house&quot; class=&quot;size-6&quot; />
    </GlassSurface>
  </div>
</template>`"
    full-width
    class="p-0"
  >
    <div
      ref="stageRef"
      class="relative flex size-full min-h-80 items-center justify-center overflow-hidden"
      @pointermove="onStageMove"
      @pointerleave="onStageLeave"
    >
      <img
        ref="backdropRef"
        :key="sky"
        :src="sky"
        alt=""
        crossorigin="anonymous"
        draggable="false"
        class="pointer-events-none absolute inset-0 size-full object-cover select-none"
      />
      <div
        ref="glassRef"
        class="relative cursor-grab touch-none select-none"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <GlassSurface
          :width="glassWidth"
          :height="params.height"
          :border-radius="params.borderRadius"
          :border-width="params.borderWidth"
          :brightness="params.brightness"
          :opacity="params.opacity"
          :blur="params.blur"
          :displace="params.displace"
          :background-opacity="params.backgroundOpacity"
          :saturation="params.saturation"
          :distortion-scale="params.distortionScale"
          :red-offset="params.redOffset"
          :green-offset="params.greenOffset"
          :blue-offset="params.blueOffset"
          :refraction="refraction"
          :renderer="renderer"
          :backdrop="backdropRef"
          :shape="shape"
        >
          <div
            v-if="icons.length > 0"
            :class="['flex w-full items-center justify-around px-3', iconColor]"
          >
            <Icon
              v-for="name in icons"
              :key="name"
              :name="name"
              :class="params.preset === 'player' ? 'size-7' : 'size-6'"
              :size="params.preset === 'player' ? 28 : 24"
            />
          </div>
        </GlassSurface>
      </div>
      <input
        ref="fileRef"
        type="file"
        accept="image/svg+xml,image/png,image/webp"
        class="hidden"
        @change="onFile"
      />
      <ShaderPane title="Glass Surface" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
