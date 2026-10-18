<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import TiltedCard from '@registry/new-york/tilted-card/TiltedCard.vue';
  import TiltedCardLayer from '@registry/new-york/tilted-card/TiltedCardLayer.vue';
  import type { TiltedCardProps } from '@registry/new-york/tilted-card/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const UNSPLASH = 'https://images.unsplash.com/';
  const SIZE = '?q=80&w=900&auto=format&fit=crop';
  const PHOTOS = {
    dark: {
      sky: `${UNSPLASH}photo-1419242902214-272b3f66ee7a${SIZE}`,
      field: `${UNSPLASH}photo-1444703686981-a3abbc4d4fe3${SIZE}`,
      pier: `${UNSPLASH}photo-1534447677768-be436bb09401${SIZE}`,
    },
    light: {
      sky: `${UNSPLASH}photo-1470252649378-9c29740c9fa8${SIZE}`,
      field: `${UNSPLASH}photo-1500382017468-9049fed747ef${SIZE}`,
      pier: `${UNSPLASH}photo-1507525428034-b723cf961d3e${SIZE}`,
    },
  };
  const photos = computed(() => PHOTOS[theme.value]);

  const TRACKS = [
    { name: 'Open Sky', length: '3:41' },
    { name: 'Pier Lights', length: '4:05' },
    { name: 'Canola', length: '2:58' },
    { name: 'Low Tide', length: '3:22' },
    { name: 'Last Light', length: '4:47' },
  ];

  const GALLERY = [
    {
      key: 'pier',
      title: 'The Pier',
      note: { dark: 'Dusk', light: 'Clear sky' },
    },
    {
      key: 'field',
      title: 'Canola Field',
      note: { dark: 'Moonrise', light: 'Midday' },
    },
    {
      key: 'sky',
      title: 'Open Sky',
      note: { dark: 'Blue hour', light: 'Golden hour' },
    },
  ] as const;

  // Deterministic PRNG so SSR and client render the same QR / barcode.
  function seeded(start: number) {
    let seed = start;
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const QR_SIZE = 21;
  const FINDERS = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ];
  function finder(x: number, y: number) {
    for (const [cx = 0, cy = 0] of FINDERS) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0;
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        return ring === 3 || ring <= 1 ? 1 : 0;
      }
    }
    return -1;
  }
  const QR = (() => {
    const next = seeded(42);
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < QR_SIZE; y++) {
      for (let x = 0; x < QR_SIZE; x++) {
        const fixed = finder(x, y);
        const on =
          fixed >= 0
            ? fixed === 1
            : y === 6 || x === 6
              ? (x + y) % 2 === 0
              : next() > 0.52;
        if (on) cells.push({ x, y });
      }
    }
    return cells;
  })();

  const BARS = (() => {
    const next = seeded(7);
    const bars: { y: number; height: number }[] = [];
    let y = 0;
    while (y < 96) {
      const height = next() > 0.6 ? 2.4 : 1.2;
      if (next() > 0.25) bars.push({ y, height });
      y += height + (next() > 0.5 ? 1.6 : 1.1);
    }
    return bars;
  })();

  const LOOK: Required<
    Pick<
      TiltedCardProps,
      | 'rotateAmplitude'
      | 'scaleOnHover'
      | 'perspective'
      | 'smoothness'
      | 'glare'
      | 'glareColor'
      | 'shadow'
      | 'parallax'
      | 'radius'
      | 'axis'
      | 'reverse'
      | 'trackWindow'
      | 'floating'
    >
  > = {
    rotateAmplitude: 12,
    scaleOnHover: 1.05,
    perspective: 800,
    smoothness: 0.6,
    glare: 0.5,
    glareColor: '#ffffff',
    shadow: 0.5,
    parallax: 1,
    radius: 15,
    axis: 'both',
    reverse: false,
    trackWindow: false,
    floating: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    gentle: {
      rotateAmplitude: 6,
      scaleOnHover: 1.02,
      smoothness: 0.85,
      glare: 0.3,
      parallax: 0.6,
    },
    bold: {
      rotateAmplitude: 22,
      scaleOnHover: 1.08,
      smoothness: 0.4,
      glare: 0.85,
      shadow: 0.85,
      parallax: 1.6,
    },
    floating: { floating: true, smoothness: 0.75 },
    follow: { trackWindow: true, rotateAmplitude: 16 },
    reverse: { reverse: true },
    swing: { axis: 'horizontal', rotateAmplitude: 22, smoothness: 0.8 },
  };

  const params = reactive({
    demo: 'album',
    preset: 'classic',
    ...LOOK,
    showTooltip: true,
    displayOverlayContent: true,
    flipOnClick: true,
    intro: true,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const card = computed<TiltedCardProps>(() => ({
    rotateAmplitude: params.rotateAmplitude,
    scaleOnHover: params.scaleOnHover,
    perspective: params.perspective,
    smoothness: params.smoothness,
    glare: params.glare,
    glareColor: params.glareColor,
    shadow: params.shadow,
    parallax: params.parallax,
    radius: params.radius,
    axis: params.axis,
    reverse: params.reverse,
    trackWindow: params.trackWindow,
    floating: params.floating,
    showTooltip: params.showTooltip,
    flipOnClick: params.flipOnClick,
    intro: params.intro,
  }));

  const sceneKey = computed(() => `${params.demo}-${replayKey.value}`);

  function applyPreset(value: string) {
    Object.assign(params, LOOK, PRESETS[value]);
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'demo', {
      options: {
        Album: 'album',
        Gallery: 'gallery',
        Ticket: 'ticket',
        Basic: 'basic',
      },
    });
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Gentle: 'gentle',
          Bold: 'bold',
          Floating: 'floating',
          Follow: 'follow',
          Reverse: 'reverse',
          Swing: 'swing',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'axis', {
      options: {
        Both: 'both',
        Horizontal: 'horizontal',
        Vertical: 'vertical',
      },
    });
    pane.addBinding(params, 'glareColor', { label: 'glare color' });
    pane.addBinding(params, 'rotateAmplitude', {
      label: 'tilt',
      min: 0,
      max: 30,
      step: 1,
    });
    pane.addBinding(params, 'scaleOnHover', {
      label: 'scale on hover',
      min: 1,
      max: 1.3,
      step: 0.01,
    });
    pane.addBinding(params, 'perspective', { min: 300, max: 2000, step: 50 });
    pane.addBinding(params, 'smoothness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glare', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shadow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'parallax', { min: 0, max: 2.5, step: 0.1 });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'showTooltip', { label: 'tooltip' });
    pane.addBinding(params, 'displayOverlayContent', {
      label: 'overlay (basic)',
    });
    pane.addBinding(params, 'flipOnClick', { label: 'flip on click' });
    pane.addBinding(params, 'reverse');
    pane.addBinding(params, 'trackWindow', { label: 'track window' });
    pane.addBinding(params, 'floating');
    pane.addBinding(params, 'intro').on('change', replay);
  }

  function introDelay(index: number) {
    return index * 110;
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { TiltedCard, TiltedCardLayer } from '~/components/ui/tilted-card';
</script>

<template>
  <div class=&quot;aspect-square w-75&quot;>
    <TiltedCard
      image-src=&quot;/covers/open-sky.webp&quot;
      alt-text=&quot;Open Sky album cover&quot;
      caption-text=&quot;Open Sky — Blue Hour&quot;
      container-width=&quot;100%&quot;
      container-height=&quot;100%&quot;
      image-width=&quot;100%&quot;
      image-height=&quot;100%&quot;
      :rotate-amplitude=&quot;12&quot;
      :scale-on-hover=&quot;1.05&quot;
      :glare=&quot;0.5&quot;
      :shadow=&quot;0.5&quot;
      :parallax=&quot;1&quot;
    >
      <TiltedCardLayer :depth=&quot;28&quot;>
        <div class=&quot;absolute bottom-4 left-4 text-white&quot;>
          <strong>Open Sky</strong>
          <span>Blue Hour</span>
        </div>
      </TiltedCardLayer>

      <template #back>
        <ol class=&quot;absolute inset-0 bg-card p-4&quot;>
          <li>Open Sky · 3:41</li>
          <li>Pier Lights · 4:05</li>
        </ol>
      </template>
    </TiltedCard>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden">
      <div :key="sceneKey" class="tcd-scene" :data-theme="theme">
        <div v-if="params.demo === 'album'" class="tcd-album">
          <TiltedCard
            v-bind="card"
            :image-src="photos.sky"
            alt-text="Open Sky album cover"
            caption-text="Open Sky — Blue Hour"
            container-width="100%"
            container-height="100%"
            image-width="100%"
            image-height="100%"
          >
            <span class="tcd-scrim" />
            <TiltedCardLayer :depth="28">
              <div class="tcd-album__meta">
                <strong>Open Sky</strong>
                <span>Blue Hour</span>
              </div>
            </TiltedCardLayer>
            <TiltedCardLayer :depth="52">
              <span class="tcd-album__play">
                <Icon name="lucide:play" class="size-4.5" />
              </span>
            </TiltedCardLayer>

            <template #back>
              <div class="tcd-tracks">
                <div class="tcd-tracks__head">
                  <img
                    class="tcd-tracks__cover"
                    :src="photos.sky"
                    alt=""
                    draggable="false"
                  />
                  <div class="tcd-tracks__title">
                    <strong>Open Sky</strong>
                    <span>Blue Hour · 5 tracks</span>
                  </div>
                </div>
                <ol class="tcd-tracks__list">
                  <li
                    v-for="(track, index) in TRACKS"
                    :key="track.name"
                    :data-current="index === 0 ? '' : undefined"
                  >
                    <span class="tcd-tracks__number">{{ index + 1 }}</span>
                    <span class="tcd-tracks__name">{{ track.name }}</span>
                    <span class="tcd-tracks__length">{{ track.length }}</span>
                  </li>
                </ol>
              </div>
            </template>
          </TiltedCard>
        </div>

        <div v-else-if="params.demo === 'gallery'" class="tcd-gallery">
          <div
            v-for="(item, index) in GALLERY"
            :key="item.key"
            class="tcd-gallery__cell"
          >
            <TiltedCard
              v-bind="card"
              :image-src="photos[item.key]"
              :alt-text="item.title"
              :caption-text="item.title"
              container-width="100%"
              container-height="100%"
              image-width="100%"
              image-height="100%"
              :intro-delay="introDelay(index)"
            >
              <span class="tcd-scrim" />
              <TiltedCardLayer :depth="30">
                <div class="tcd-gallery__meta">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.note[theme] }}</span>
                </div>
              </TiltedCardLayer>
            </TiltedCard>
          </div>
        </div>

        <div v-else-if="params.demo === 'ticket'" class="tcd-ticket-stage">
          <TiltedCard
            v-bind="card"
            alt-text="Night Sky Live ticket"
            caption-text="Admit one"
            container-width="100%"
            container-height="100%"
            image-width="100%"
            image-height="100%"
            class="tcd-ticket-card"
          >
            <div class="tcd-ticket">
              <TiltedCardLayer :depth="22" class="tcd-ticket__main">
                <span class="tcd-ticket__label">
                  <span class="tcd-ticket__icon">
                    <Icon name="lucide:ticket" class="size-3.5" />
                  </span>
                  Admit one
                </span>
                <div class="tcd-ticket__title">
                  <strong>Night Sky Live</strong>
                  <span>Pier Amphitheater</span>
                </div>
                <dl class="tcd-ticket__info">
                  <div>
                    <dt>Date</dt>
                    <dd>Oct 24</dd>
                  </div>
                  <div>
                    <dt>Doors</dt>
                    <dd>20:30</dd>
                  </div>
                  <div>
                    <dt>Seat</dt>
                    <dd>B 12</dd>
                  </div>
                </dl>
              </TiltedCardLayer>
              <TiltedCardLayer :depth="12" class="tcd-ticket__stub">
                <svg
                  class="tcd-barcode"
                  viewBox="0 0 24 96"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    v-for="bar in BARS"
                    :key="bar.y"
                    x="0"
                    :y="bar.y"
                    width="24"
                    :height="bar.height"
                  />
                </svg>
                <span class="tcd-ticket__gate">Gate 4</span>
              </TiltedCardLayer>
            </div>

            <template #back>
              <div class="tcd-ticket tcd-ticket--back">
                <svg
                  class="tcd-qr"
                  :viewBox="`0 0 ${QR_SIZE} ${QR_SIZE}`"
                  shape-rendering="crispEdges"
                  aria-hidden="true"
                >
                  <rect
                    v-for="cell in QR"
                    :key="`${cell.x}-${cell.y}`"
                    :x="cell.x"
                    :y="cell.y"
                    width="1"
                    height="1"
                  />
                </svg>
                <div class="tcd-ticket__scan">
                  <strong>Scan at the gate</strong>
                  <span>Ticket 0042 · Seat B 12</span>
                </div>
              </div>
            </template>
          </TiltedCard>
        </div>

        <TiltedCard
          v-else
          v-bind="card"
          :image-src="photos.sky"
          alt-text="Open Sky"
          caption-text="Open Sky"
          container-width="300px"
          container-height="300px"
          image-width="300px"
          image-height="300px"
          :display-overlay-content="params.displayOverlayContent"
        >
          <template #overlay>
            <p class="tcd-overlay">Open Sky</p>
          </template>
        </TiltedCard>
      </div>
      <ShaderPane title="Tilted Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  .tcd-scene {
    --tcd-surface: linear-gradient(180deg, #1c1a22 0%, #131217 100%);
    --tcd-tile: linear-gradient(180deg, #3a3644 0%, #27242f 100%);
    --tcd-tile-rim:
      inset 0 0 0 1px rgba(255, 255, 255, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --tcd-ink: #f4f4f5;
    --tcd-muted: rgba(244, 244, 245, 0.6);
    --tcd-faint: rgba(244, 244, 245, 0.34);
    --tcd-line: rgba(244, 244, 245, 0.16);
    container: tcd / inline-size;
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    box-sizing: border-box;
    padding: 28px;
    place-items: center;
  }

  .tcd-scene[data-theme='light'] {
    --tcd-surface: linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%);
    --tcd-tile: linear-gradient(180deg, #ffffff 0%, #f3f3f6 100%);
    --tcd-tile-rim:
      inset 0 0 0 1px rgba(24, 24, 27, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 1);
    --tcd-ink: #18181b;
    --tcd-muted: rgba(24, 24, 27, 0.6);
    --tcd-faint: rgba(24, 24, 27, 0.36);
    --tcd-line: rgba(24, 24, 27, 0.14);
  }

  .tcd-scene[data-theme='light'] :deep(.tilted-card) {
    --tc-rim-color: rgba(24, 24, 27, 0.08);
    --tc-rim-light: rgba(255, 255, 255, 0.9);
  }

  .tcd-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(10, 9, 13, 0.78) 0%,
      rgba(10, 9, 13, 0.66) 14%,
      rgba(10, 9, 13, 0.42) 30%,
      rgba(10, 9, 13, 0.18) 46%,
      rgba(10, 9, 13, 0.04) 60%,
      rgba(10, 9, 13, 0) 72%
    );
    pointer-events: none;
  }

  .tcd-album {
    width: min(300px, 100%);
    aspect-ratio: 1;
  }

  .tcd-album__meta,
  .tcd-gallery__meta {
    position: absolute;
    left: 18px;
    bottom: 17px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #ffffff;
  }

  .tcd-album__meta strong {
    font-size: 17px;
    font-weight: 600;
    line-height: 22px;
    letter-spacing: -0.01em;
  }

  .tcd-album__meta span,
  .tcd-gallery__meta span {
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    line-height: 18px;
  }

  .tcd-album__play {
    position: absolute;
    right: 16px;
    bottom: 16px;
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
    border-radius: 50%;
    background: #f4f4f5;
    color: #121016;
    box-shadow: 0 10px 22px -10px rgba(0, 0, 0, 0.7);
  }

  .tcd-album__play :deep(svg) {
    transform: translateX(1px);
  }

  .tcd-tracks {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    background: var(--tcd-surface);
    color: var(--tcd-ink);
  }

  .tcd-tracks__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tcd-tracks__cover {
    width: 44px;
    height: 44px;
    flex: none;
    border-radius: 10px;
    object-fit: cover;
  }

  .tcd-tracks__title {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  .tcd-tracks__title strong {
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
  }

  .tcd-tracks__title span {
    color: var(--tcd-muted);
    font-size: 12.5px;
    line-height: 16px;
  }

  .tcd-tracks__list {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    margin: 0;
    padding: 4px 0 0;
    list-style: none;
  }

  .tcd-tracks__list li {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    color: var(--tcd-muted);
    font-size: 13px;
    line-height: 18px;
  }

  .tcd-tracks__list li[data-current] {
    color: var(--tcd-ink);
    font-weight: 500;
  }

  .tcd-tracks__number {
    color: var(--tcd-faint);
    font-variant-numeric: tabular-nums;
  }

  .tcd-tracks__list li[data-current] .tcd-tracks__number {
    color: var(--tcd-ink);
  }

  .tcd-tracks__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tcd-tracks__length {
    font-variant-numeric: tabular-nums;
  }

  .tcd-gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
    width: min(660px, 100%);
  }

  .tcd-gallery__cell {
    aspect-ratio: 4 / 5;
  }

  .tcd-gallery__meta {
    left: 16px;
    bottom: 15px;
  }

  .tcd-gallery__meta strong {
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
  }

  @container tcd (max-width: 600px) {
    .tcd-gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: min(440px, 100%);
    }

    .tcd-gallery__cell:nth-child(3) {
      display: none;
    }
  }

  @container tcd (max-width: 400px) {
    .tcd-gallery {
      grid-template-columns: minmax(0, 1fr);
      width: min(250px, 100%);
    }

    .tcd-gallery__cell:nth-child(2) {
      display: none;
    }
  }

  .tcd-ticket-stage {
    --tcd-stub: 96px;
    width: min(400px, 100%);
    aspect-ratio: 400 / 190;
    min-height: 168px;
  }

  .tcd-ticket-card :deep(.tilted-card__front) {
    -webkit-mask:
      radial-gradient(
        circle 9px at calc(100% - var(--tcd-stub)) 0,
        #0000 8.5px,
        #000 9.5px
      ),
      radial-gradient(
        circle 9px at calc(100% - var(--tcd-stub)) 100%,
        #0000 8.5px,
        #000 9.5px
      );
    -webkit-mask-composite: source-in;
    mask:
      radial-gradient(
        circle 9px at calc(100% - var(--tcd-stub)) 0,
        #0000 8.5px,
        #000 9.5px
      ),
      radial-gradient(
        circle 9px at calc(100% - var(--tcd-stub)) 100%,
        #0000 8.5px,
        #000 9.5px
      );
    mask-composite: intersect;
  }

  .tcd-ticket-card :deep(.tilted-card__back) {
    -webkit-mask:
      radial-gradient(circle 9px at var(--tcd-stub) 0, #0000 8.5px, #000 9.5px),
      radial-gradient(
        circle 9px at var(--tcd-stub) 100%,
        #0000 8.5px,
        #000 9.5px
      );
    -webkit-mask-composite: source-in;
    mask:
      radial-gradient(circle 9px at var(--tcd-stub) 0, #0000 8.5px, #000 9.5px),
      radial-gradient(
        circle 9px at var(--tcd-stub) 100%,
        #0000 8.5px,
        #000 9.5px
      );
    mask-composite: intersect;
  }

  .tcd-ticket {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--tcd-stub);
    background: var(--tcd-surface);
    color: var(--tcd-ink);
  }

  .tcd-ticket .tcd-ticket__main {
    position: relative;
    inset: auto;
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px 20px;
  }

  .tcd-ticket__label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--tcd-muted);
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }

  .tcd-ticket__icon {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 7px;
    background: var(--tcd-tile);
    box-shadow: var(--tcd-tile-rim);
    color: var(--tcd-ink);
  }

  .tcd-ticket__title {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tcd-ticket__title strong {
    font-size: 19px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: -0.015em;
  }

  .tcd-ticket__title span {
    color: var(--tcd-muted);
    font-size: 12.5px;
    line-height: 16px;
  }

  .tcd-ticket__info {
    display: flex;
    gap: 22px;
    margin: 0;
  }

  .tcd-ticket__info div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tcd-ticket__info dt {
    color: var(--tcd-faint);
    font-size: 11px;
    line-height: 14px;
  }

  .tcd-ticket__info dd {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 18px;
    font-variant-numeric: tabular-nums;
  }

  .tcd-ticket .tcd-ticket__stub {
    position: relative;
    inset: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background-image: linear-gradient(var(--tcd-line) 55%, transparent 55%);
    background-position: left top;
    background-repeat: repeat-y;
    background-size: 1px 7px;
  }

  .tcd-barcode {
    width: 34px;
    height: 92px;
    fill: var(--tcd-ink);
    opacity: 0.88;
  }

  .tcd-ticket__gate {
    color: var(--tcd-muted);
    font-size: 12px;
    line-height: 16px;
  }

  .tcd-ticket--back {
    grid-template-columns: var(--tcd-stub) minmax(0, 1fr);
    align-items: center;
  }

  .tcd-qr {
    width: 62px;
    height: 62px;
    justify-self: center;
    fill: var(--tcd-ink);
  }

  .tcd-ticket__scan {
    display: flex;
    flex-direction: column;
    gap: 3px;
    height: 100%;
    justify-content: center;
    padding: 0 20px;
    background-image: linear-gradient(var(--tcd-line) 55%, transparent 55%);
    background-position: left top;
    background-repeat: repeat-y;
    background-size: 1px 7px;
  }

  .tcd-ticket__scan strong {
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
  }

  .tcd-ticket__scan span {
    color: var(--tcd-muted);
    font-size: 12.5px;
    line-height: 16px;
  }

  @container tcd (max-width: 380px) {
    .tcd-ticket-stage {
      --tcd-stub: 78px;
    }

    .tcd-ticket .tcd-ticket__main {
      padding: 15px 16px;
    }

    .tcd-ticket__title strong {
      font-size: 17px;
    }

    .tcd-ticket__info {
      gap: 14px;
    }

    .tcd-barcode {
      width: 28px;
      height: 80px;
    }
  }

  .tcd-overlay {
    margin: 0;
    padding: 18px 20px;
    color: #ffffff;
    font-size: 17px;
    font-weight: 600;
    line-height: 22px;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
  }
</style>
