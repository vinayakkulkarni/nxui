<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
  import Lanyard from '@registry/new-york/lanyard/Lanyard.vue';
  import type {
    LanyardAnchor,
    LanyardFinish,
    LanyardImageFit,
    LanyardMetal,
    LanyardOrientation,
  } from '@registry/new-york/lanyard/types';
  import type { Pane } from 'tweakpane';

  const PORTRAIT =
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&h=1100&fit=crop&crop=faces&sat=-100&q=80';
  const MARK = 'M10.5 24V11m0 4.5a5.5 5.5 0 0 1 11 0V24';

  const DEFAULT_FIT: LanyardImageFit = 'cover';
  const DEFAULT_ORIENTATION: LanyardOrientation = 'portrait';
  const DEFAULT_FINISH: LanyardFinish = 'glossy';
  const DEFAULT_ANCHOR: LanyardAnchor = 'center';
  const DEFAULT_METAL: LanyardMetal = 'silver';

  const params = reactive({
    imageFit: DEFAULT_FIT,
    orientation: DEFAULT_ORIENTATION,
    finish: DEFAULT_FINISH,
    metal: DEFAULT_METAL,
    cardColor: '#ffffff',
    plainStrap: false,
    strapColor: '#111111',
    cornerRadius: 0.3,
    anchor: DEFAULT_ANCHOR,
    size: 0.6,
    strapLength: 0.5,
    strapWidth: 0.65,
    gravity: 1,
    damping: 0.5,
    elasticity: 0.5,
    breeze: 0.5,
    interactive: true,
    intro: true,
  });

  const art = reactive({ front: '', back: '', strap: '' });
  const uploads = reactive({ front: '', back: '', strap: '' });
  const fileInput = ref<HTMLInputElement | null>(null);
  let uploadSlot: 'front' | 'back' | 'strap' = 'front';

  const frontImage = computed(() => uploads.front || art.front || undefined);
  const backImage = computed(
    () => uploads.back || uploads.front || art.back || undefined,
  );
  const strapImage = computed(() =>
    params.plainStrap ? undefined : uploads.strap || art.strap || undefined,
  );

  function drawMark(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 32, size / 32);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(MARK));
    ctx.restore();
  }

  function makeCanvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function paintBack() {
    const canvas = makeCanvas(1024, 1440);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1024, 1440);
    drawMark(ctx, 512 - 220, 720 - 220, 440, '#fafafa');
    ctx.fillStyle = 'rgba(250,250,250,0.55)';
    ctx.font = '500 38px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('nxui.geoql.in', 512, 1340);
    art.back = canvas.toDataURL('image/png');
  }

  function paintStrapTile() {
    const canvas = makeCanvas(1000, 250);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1000, 250);
    drawMark(ctx, 290, 45, 160, '#fafafa');
    ctx.fillStyle = '#fafafa';
    ctx.font = '600 120px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('nxui', 470, 130);
    art.strap = canvas.toDataURL('image/png');
  }

  function paintFront(photo: HTMLImageElement | null) {
    const canvas = makeCanvas(1024, 1440);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1440);
    drawMark(ctx, 950 - 520, 470, 560, 'rgba(10,10,10,0.07)');
    if (photo) {
      const w = 760;
      const h = 930;
      const scale = Math.max(w / photo.width, h / photo.height);
      const sw = w / scale;
      const sh = h / scale;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(70, 330, w, h, 36);
      ctx.clip();
      ctx.filter = 'grayscale(1) contrast(1.08)';
      ctx.drawImage(
        photo,
        (photo.width - sw) / 2,
        (photo.height - sh) / 2,
        sw,
        sh,
        70,
        330,
        w,
        h,
      );
      ctx.restore();
    }
    drawMark(ctx, 70, 90, 96, '#0a0a0a');
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 46px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('@nxui', 954, 150);
    ctx.font = '500 34px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(10,10,10,0.6)';
    ctx.fillText('Vue ✦ nxui', 954, 1340);
    art.front = canvas.toDataURL('image/png');
  }

  onMounted(() => {
    paintBack();
    paintStrapTile();
    const photo = new Image();
    photo.crossOrigin = 'anonymous';
    photo.onload = () => paintFront(photo);
    photo.onerror = () => paintFront(null);
    photo.src = PORTRAIT;
  });

  function revokeAll() {
    for (const url of [uploads.front, uploads.back, uploads.strap])
      if (url) URL.revokeObjectURL(url);
  }

  onBeforeUnmount(revokeAll);

  function openPicker(slot: 'front' | 'back' | 'strap') {
    uploadSlot = slot;
    fileInput.value?.click();
  }

  function onFile(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const previous = uploads[uploadSlot];
    if (previous) URL.revokeObjectURL(previous);
    uploads[uploadSlot] = URL.createObjectURL(file);
  }

  function clearUploads() {
    revokeAll();
    uploads.front = '';
    uploads.back = '';
    uploads.strap = '';
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addButton({ title: 'Upload front image' })
      .on('click', () => openPicker('front'));
    pane
      .addButton({ title: 'Upload back image' })
      .on('click', () => openPicker('back'));
    pane
      .addButton({ title: 'Upload band image' })
      .on('click', () => openPicker('strap'));
    pane.addButton({ title: 'Clear uploads' }).on('click', clearUploads);
    pane.addBinding(params, 'imageFit', {
      options: { Cover: 'cover', Contain: 'contain' },
    });
    pane.addBinding(params, 'orientation', {
      options: { Portrait: 'portrait', Landscape: 'landscape' },
    });
    pane.addBinding(params, 'finish', {
      options: {
        Glossy: 'glossy',
        Matte: 'matte',
        Holographic: 'holographic',
        Metallic: 'metallic',
      },
    });
    pane.addBinding(params, 'metal', {
      options: { Graphite: 'graphite', Silver: 'silver', Gold: 'gold' },
    });
    pane.addBinding(params, 'cardColor');
    pane.addBinding(params, 'plainStrap', { label: 'plain band' });
    pane.addBinding(params, 'strapColor', { label: 'band color' });
    pane.addBinding(params, 'cornerRadius', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'anchor', {
      options: { Left: 'left', Center: 'center', Right: 'right' },
    });
    pane.addBinding(params, 'size', { min: 0.2, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'strapLength', {
      label: 'band length',
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'strapWidth', {
      label: 'band width',
      min: 0.4,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'gravity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'damping', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'elasticity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'breeze', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Lanyard from '~/components/ui/lanyard/Lanyard.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <Lanyard
      front-image=&quot;/badge-front.webp&quot;
      back-image=&quot;/badge-back.webp&quot;
      strap-image=&quot;/band.png&quot;
      finish=&quot;glossy&quot;
      metal=&quot;silver&quot;
      :size=&quot;0.6&quot;
      :strap-length=&quot;0.5&quot;
      :breeze=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-120 overflow-hidden">
      <p
        class="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-muted-foreground select-none"
      >
        Try dragging
      </p>
      <Lanyard
        class="absolute inset-0 size-full"
        :front-image="frontImage"
        :back-image="backImage"
        :strap-image="strapImage"
        :image-fit="params.imageFit"
        :card-color="params.cardColor"
        :orientation="params.orientation"
        :finish="params.finish"
        :corner-radius="params.cornerRadius"
        :size="params.size"
        :anchor="params.anchor"
        :strap-length="params.strapLength"
        :strap-color="params.strapColor"
        :strap-width="params.strapWidth"
        :metal="params.metal"
        :gravity="params.gravity"
        :damping="params.damping"
        :elasticity="params.elasticity"
        :breeze="params.breeze"
        :interactive="params.interactive"
        :intro="params.intro"
      />
      <ShaderPane title="Lanyard" @on-pane-created="onPaneCreated" />
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        class="hidden"
        aria-hidden="true"
        tabindex="-1"
        @change="onFile"
      />
    </div>
  </ComponentDemo>
</template>
