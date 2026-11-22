<script setup lang="ts">
  // Vue port of File Box from Pin UI (https://pinui.xyz), MIT licence.
  import {
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import { cn } from '~/lib/utils';
  import { SCENE } from './file-box-geometry';
  import { createFileBoxEngine } from './file-box-motion';
  import type {
    FileBoxEngine,
    FileBoxFolderNodes,
    FileBoxNodeRef as NodeRef,
    FileBoxProps,
    FileBoxPull,
  } from './types';

  const props = withDefaults(defineProps<FileBoxProps>(), {
    theme: 'light',
    fill: false,
    class: '',
  });

  const emit = defineEmits<{ pull: [folder: FileBoxPull] }>();

  /* gradient and filter ids, unique per instance */
  const id = useId().replace(/[^\w-]/g, '');
  const url = (name: string): string => `url(#${id}-${name})`;

  const folders = SCENE.folders;
  const count = folders.length;

  const rootRef = useTemplateRef<HTMLElement>('root');
  const posterRef = useTemplateRef<HTMLElement>('poster');
  const sceneRef = useTemplateRef<SVGGElement>('scene');
  const shadowRef = useTemplateRef<SVGGElement>('shadow');
  const boxBackRef = useTemplateRef<SVGGElement>('boxBack');
  const boxFrontRef = useTemplateRef<SVGGElement>('boxFront');

  const gEls: Array<SVGGElement | null> = [];
  const frontEls: Array<SVGGElement | null> = [];
  const occEls: Array<SVGGElement | null> = [];
  const extendEls: Array<SVGPathElement | null> = [];
  const paperEls: Array<Array<SVGGElement | null>> = folders.map(() => []);

  const asG = (el: NodeRef): SVGGElement | null =>
    el instanceof SVGGElement ? el : null;

  function setG(i: number, el: NodeRef): void {
    gEls[i] = asG(el);
  }
  function setFront(i: number, el: NodeRef): void {
    frontEls[i] = asG(el);
  }
  function setOcc(i: number, el: NodeRef): void {
    occEls[i] = asG(el);
  }
  function setPaper(i: number, j: number, el: NodeRef): void {
    const row = paperEls[i];
    if (row) row[j] = asG(el);
  }
  function setExtend(i: number, el: NodeRef): void {
    extendEls[i] = el instanceof SVGPathElement ? el : null;
  }

  const ready = ref(false);
  let engine: FileBoxEngine | null = null;

  function collect(): FileBoxFolderNodes[] | null {
    const out: FileBoxFolderNodes[] = [];
    for (const view of folders) {
      const i = view.index;
      const g = gEls[i];
      const front = frontEls[i];
      const occ = occEls[i];
      const extend = extendEls[i];
      const papers = (paperEls[i] ?? []).filter(
        (p): p is SVGGElement => p !== null,
      );
      if (!g || !front || !occ || !extend || papers.length !== 3) return null;
      out.push({ view, g, front, papers, occ, extend });
    }
    return out;
  }

  onMounted(() => {
    const poster = posterRef.value;
    const scene = sceneRef.value;
    const shadow = shadowRef.value;
    const boxBack = boxBackRef.value;
    const boxFront = boxFrontRef.value;
    const live = collect();
    if (!poster || !scene || !shadow || !boxBack || !boxFront || !live) return;
    engine = createFileBoxEngine(
      { poster, scene, shadow, boxBack, boxFront, folders: live },
      {
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onReady: () => {
          ready.value = true;
        },
        onPull: (folder) => emit('pull', folder),
      },
    );
    engine.intro();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  /* the box gives a little under the new light */
  watch(
    () => props.theme,
    () => engine?.settle(),
  );

  function onEnter(i: number): void {
    engine?.enter(i);
  }
  function onLeave(i: number): void {
    engine?.leave(i);
  }
  function onPull(i: number): void {
    engine?.pull(i);
  }
  function onHitKeydown(event: KeyboardEvent, i: number): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    engine?.pull(i);
  }

  function onPointerMove(event: PointerEvent): void {
    const root = rootRef.value;
    if (!root) return;
    const r = root.getBoundingClientRect();
    engine?.tilt(
      (event.clientX - r.left) / r.width - 0.5,
      (event.clientY - r.top) / r.height - 0.5,
    );
  }
  function onPointerLeave(): void {
    engine?.untilt();
  }

  /* R replays the intro while the box has focus */
  function onRootKeydown(event: KeyboardEvent): void {
    if (
      event.key.toLowerCase() === 'r' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.repeat
    )
      engine?.intro();
  }

  /* folder positions are counted from the front (1–5), as in the `pull` event */
  const indexOf = (position: number): number => count - position;

  /* imperative hooks, so a host (e.g. an idle demo) can drive it */
  defineExpose({
    /** Lift the folder at `position` (1 = front), or drop all with `null`. */
    hover: (position: number | null) =>
      engine?.hover(position === null ? null : indexOf(position), true),
    /** Tug the folder at `position` (1 = front). */
    pull: (position: number) => engine?.pull(indexOf(position)),
    /** Drop a folder lifted through `hover`, leaving a real hover alone. */
    release: () => engine?.release(),
    replay: () => engine?.intro(),
  });
</script>

<template>
  <div
    ref="root"
    :class="cn('pfbox', props.class)"
    :data-theme="theme"
    :data-fill="fill || undefined"
    :data-ready="ready ? '' : undefined"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @keydown="onRootKeydown"
  >
    <div ref="poster" class="pfbox__poster">
      <svg
        viewBox="0 0 736 736"
        class="pfbox__art"
        stroke-width="3.4"
        stroke-linejoin="round"
        stroke-linecap="round"
        role="group"
        aria-label="A cardboard file box holding five colourful folders. Hover or focus a folder to lift it out; click or press Enter to tug it."
      >
        <defs>
          <linearGradient :id="`${id}-occ`" x1="0" y1="1" x2="0" y2="0">
            <stop
              offset="0"
              :style="{
                stopColor: 'var(--pfbox-occ)',
                stopOpacity: 'var(--pfbox-occ-o)',
              }"
            />
            <stop
              offset="1"
              :style="{ stopColor: 'var(--pfbox-occ)', stopOpacity: 0 }"
            />
          </linearGradient>
          <linearGradient :id="`${id}-hollow-back`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :style="{ stopColor: 'var(--pfbox-hollow-1)' }" />
            <stop offset="1" :style="{ stopColor: 'var(--pfbox-hollow-2)' }" />
          </linearGradient>
          <linearGradient :id="`${id}-hollow-side`" x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0"
              :style="{ stopColor: 'var(--pfbox-hollow-side-1)' }"
            />
            <stop
              offset="1"
              :style="{ stopColor: 'var(--pfbox-hollow-side-2)' }"
            />
          </linearGradient>
          <linearGradient :id="`${id}-face-front`" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              :style="{ stopColor: 'var(--pfbox-face-front-1)' }"
            />
            <stop
              offset="1"
              :style="{ stopColor: 'var(--pfbox-face-front-2)' }"
            />
          </linearGradient>
          <linearGradient :id="`${id}-face-side`" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0"
              :style="{ stopColor: 'var(--pfbox-face-side-1)' }"
            />
            <stop
              offset="1"
              :style="{ stopColor: 'var(--pfbox-face-side-2)' }"
            />
          </linearGradient>
          <filter
            :id="`${id}-blur-wide`"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter
            :id="`${id}-blur-tight`"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <g ref="scene">
          <!-- the shadow on the table -->
          <g ref="shadow">
            <path
              :d="SCENE.base"
              stroke="none"
              :filter="url('blur-wide')"
              transform="translate(22 12)"
              :style="{
                fill: 'var(--pfbox-shadow-wide)',
                fillOpacity: 'var(--pfbox-shadow-wide-o)',
              }"
            />
            <path
              :d="SCENE.base"
              stroke="none"
              :filter="url('blur-tight')"
              transform="translate(4 3)"
              :style="{
                fill: 'var(--pfbox-shadow-tight)',
                fillOpacity: 'var(--pfbox-shadow-tight-o)',
              }"
            />
          </g>

          <!-- the hollow back of the box -->
          <g ref="boxBack">
            <path :d="SCENE.hollowBack" :fill="url('hollow-back')" />
            <path :d="SCENE.hollowSide" :fill="url('hollow-side')" />
            <path :d="SCENE.rimBack" :style="{ fill: 'var(--pfbox-rim)' }" />
          </g>

          <!-- the folders, back to front, each followed by the rim's shadow on it -->
          <g>
            <template v-for="f in folders" :key="f.index">
              <g :ref="(el) => setG(f.index, el)" pointer-events="none">
                <g :transform="f.plane">
                  <path :d="f.back" :style="{ fill: f.backFill }" />
                  <path
                    :d="f.crease"
                    stroke-width="6"
                    :style="{ stroke: 'var(--pfbox-crease)' }"
                  />
                  <g
                    v-for="(p, j) in f.papers"
                    :key="j"
                    :ref="(el) => setPaper(f.index, j, el)"
                  >
                    <path
                      :d="p.sheet"
                      stroke-width="2.4"
                      :style="{ fill: p.fill }"
                    />
                    <path
                      v-for="(line, k) in p.lines"
                      :key="k"
                      :d="line"
                      stroke-width="2"
                      :style="{ stroke: 'var(--pfbox-paper-line)' }"
                    />
                  </g>
                  <g :ref="(el) => setFront(f.index, el)">
                    <path :d="f.flap" :style="{ fill: f.flapFill }" />
                    <path
                      :d="f.flapHi"
                      stroke-width="2"
                      :style="{ stroke: 'var(--pfbox-flap-hi)' }"
                    />
                  </g>
                </g>
              </g>
              <!-- the rim's shadow is fixed to the box, so a lifted folder slides out of it -->
              <g :ref="(el) => setOcc(f.index, el)" pointer-events="none">
                <rect
                  x="0"
                  :y="f.occY"
                  width="185"
                  height="34"
                  :fill="url('occ')"
                  stroke="none"
                  :transform="f.plane"
                />
              </g>
            </template>
          </g>

          <!-- the front and side faces, over the folders -->
          <g ref="boxFront">
            <path :d="SCENE.faceSide" :fill="url('face-side')" />
            <path :d="SCENE.faceFront" :fill="url('face-front')" />
            <path :d="SCENE.rimFront" :style="{ fill: 'var(--pfbox-rim)' }" />
            <path
              :d="SCENE.hole"
              stroke-width="9"
              :style="{ stroke: 'var(--pfbox-hole)' }"
            />
          </g>

          <!-- hit areas: the visible part at rest, extended upward while lifted -->
          <g>
            <g
              v-for="f in folders"
              :key="f.index"
              class="pfbox__hit"
              tabindex="0"
              role="button"
              :aria-label="f.label"
              :transform="f.plane"
              @pointerenter="onEnter(f.index)"
              @pointerleave="onLeave(f.index)"
              @focus="onEnter(f.index)"
              @blur="onLeave(f.index)"
              @click="onPull(f.index)"
              @keydown="onHitKeydown($event, f.index)"
            >
              <path
                class="pfbox__hitBase"
                :d="f.hitBase"
                fill="#000"
                fill-opacity="0"
                stroke="none"
              />
              <path
                :ref="(el) => setExtend(f.index, el)"
                :d="f.hitExtend"
                fill="#000"
                fill-opacity="0"
                stroke="none"
                pointer-events="none"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>

    <svg class="pfbox__grain" aria-hidden="true">
      <filter :id="`${id}-noise`">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix
          values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.6 0"
        />
      </filter>
      <rect width="100%" height="100%" :filter="url('noise')" />
    </svg>
  </div>
</template>

<style scoped>
  /* Every colour is a token; the dark set swaps in on data-theme="dark". The
     tokens are registered as typed properties, so a theme change cross-fades
     every face, folder, gradient and shadow together rather than snapping. */
  @property --pfbox-bg {
    syntax: '<color>';
    inherits: true;
    initial-value: #fbe9d2;
  }
  @property --pfbox-ink {
    syntax: '<color>';
    inherits: true;
    initial-value: #1e1e1e;
  }
  @property --pfbox-face-front-1 {
    syntax: '<color>';
    inherits: true;
    initial-value: #fbf2e3;
  }
  @property --pfbox-face-front-2 {
    syntax: '<color>';
    inherits: true;
    initial-value: #f1e3cb;
  }
  @property --pfbox-face-side-1 {
    syntax: '<color>';
    inherits: true;
    initial-value: #ebdabd;
  }
  @property --pfbox-face-side-2 {
    syntax: '<color>';
    inherits: true;
    initial-value: #dfcba8;
  }
  @property --pfbox-rim {
    syntax: '<color>';
    inherits: true;
    initial-value: #fff7ea;
  }
  @property --pfbox-hollow-1 {
    syntax: '<color>';
    inherits: true;
    initial-value: #3b322a;
  }
  @property --pfbox-hollow-2 {
    syntax: '<color>';
    inherits: true;
    initial-value: #16120f;
  }
  @property --pfbox-hollow-side-1 {
    syntax: '<color>';
    inherits: true;
    initial-value: #181410;
  }
  @property --pfbox-hollow-side-2 {
    syntax: '<color>';
    inherits: true;
    initial-value: #2c251f;
  }
  @property --pfbox-hole {
    syntax: '<color>';
    inherits: true;
    initial-value: #2b2219;
  }
  @property --pfbox-shadow-wide {
    syntax: '<color>';
    inherits: true;
    initial-value: #5b3a17;
  }
  @property --pfbox-shadow-wide-o {
    syntax: '<number>';
    inherits: true;
    initial-value: 0.26;
  }
  @property --pfbox-shadow-tight {
    syntax: '<color>';
    inherits: true;
    initial-value: #3a240c;
  }
  @property --pfbox-shadow-tight-o {
    syntax: '<number>';
    inherits: true;
    initial-value: 0.3;
  }
  @property --pfbox-occ {
    syntax: '<color>';
    inherits: true;
    initial-value: #1b120a;
  }
  @property --pfbox-occ-o {
    syntax: '<number>';
    inherits: true;
    initial-value: 0.42;
  }
  @property --pfbox-green-f {
    syntax: '<color>';
    inherits: true;
    initial-value: #22a862;
  }
  @property --pfbox-green-b {
    syntax: '<color>';
    inherits: true;
    initial-value: #167f46;
  }
  @property --pfbox-beige-f {
    syntax: '<color>';
    inherits: true;
    initial-value: #fbe6c5;
  }
  @property --pfbox-beige-b {
    syntax: '<color>';
    inherits: true;
    initial-value: #e9cc9a;
  }
  @property --pfbox-pink-f {
    syntax: '<color>';
    inherits: true;
    initial-value: #f4b6f6;
  }
  @property --pfbox-pink-b {
    syntax: '<color>';
    inherits: true;
    initial-value: #dc94e0;
  }
  @property --pfbox-orange-f {
    syntax: '<color>';
    inherits: true;
    initial-value: #f8b02a;
  }
  @property --pfbox-orange-b {
    syntax: '<color>';
    inherits: true;
    initial-value: #de930c;
  }
  @property --pfbox-paper-1 {
    syntax: '<color>';
    inherits: true;
    initial-value: #fffdf8;
  }
  @property --pfbox-paper-2 {
    syntax: '<color>';
    inherits: true;
    initial-value: #f3eee4;
  }
  @property --pfbox-paper-3 {
    syntax: '<color>';
    inherits: true;
    initial-value: #ffffff;
  }
  @property --pfbox-paper-line {
    syntax: '<color>';
    inherits: true;
    initial-value: #cbbfa9;
  }
  @property --pfbox-flap-hi {
    syntax: '<color>';
    inherits: true;
    initial-value: rgb(255 255 255 / 0.35);
  }
  @property --pfbox-crease {
    syntax: '<color>';
    inherits: true;
    initial-value: rgb(0 0 0 / 0.12);
  }
  @property --pfbox-grain-o {
    syntax: '<number>';
    inherits: true;
    initial-value: 0.16;
  }

  .pfbox {
    --pfbox-bg: #fbe9d2;
    --pfbox-ink: #1e1e1e;
    --pfbox-focus: #1e1e1e;
    --pfbox-grain-blend: multiply;
    --pfbox-grain-o: 0.16;

    --pfbox-face-front-1: #fbf2e3;
    --pfbox-face-front-2: #f1e3cb;
    --pfbox-face-side-1: #ebdabd;
    --pfbox-face-side-2: #dfcba8;
    --pfbox-rim: #fff7ea;
    --pfbox-hollow-1: #3b322a;
    --pfbox-hollow-2: #16120f;
    --pfbox-hollow-side-1: #181410;
    --pfbox-hollow-side-2: #2c251f;
    --pfbox-hole: #2b2219;
    --pfbox-shadow-wide: #5b3a17;
    --pfbox-shadow-wide-o: 0.26;
    --pfbox-shadow-tight: #3a240c;
    --pfbox-shadow-tight-o: 0.3;
    --pfbox-occ: #1b120a;
    --pfbox-occ-o: 0.42;

    --pfbox-green-f: #22a862;
    --pfbox-green-b: #167f46;
    --pfbox-beige-f: #fbe6c5;
    --pfbox-beige-b: #e9cc9a;
    --pfbox-pink-f: #f4b6f6;
    --pfbox-pink-b: #dc94e0;
    --pfbox-orange-f: #f8b02a;
    --pfbox-orange-b: #de930c;
    --pfbox-paper-1: #fffdf8;
    --pfbox-paper-2: #f3eee4;
    --pfbox-paper-3: #ffffff;
    --pfbox-paper-line: #cbbfa9;
    --pfbox-flap-hi: rgb(255 255 255 / 0.35);
    --pfbox-crease: rgb(0 0 0 / 0.12);

    position: relative;
    isolation: isolate;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    /* the box sizes itself to the largest square that fits */
    container-type: size;
    perspective: 1600px;
    background: var(--pfbox-bg);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    outline: none;

    transition-duration: 0.5s;
    transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
    transition-property:
      --pfbox-bg, --pfbox-ink, --pfbox-grain-o, --pfbox-face-front-1,
      --pfbox-face-front-2, --pfbox-face-side-1, --pfbox-face-side-2,
      --pfbox-rim, --pfbox-hollow-1, --pfbox-hollow-2, --pfbox-hollow-side-1,
      --pfbox-hollow-side-2, --pfbox-hole, --pfbox-shadow-wide,
      --pfbox-shadow-wide-o, --pfbox-shadow-tight, --pfbox-shadow-tight-o,
      --pfbox-occ, --pfbox-occ-o, --pfbox-green-f, --pfbox-green-b,
      --pfbox-beige-f, --pfbox-beige-b, --pfbox-pink-f, --pfbox-pink-b,
      --pfbox-orange-f, --pfbox-orange-b, --pfbox-paper-1, --pfbox-paper-2,
      --pfbox-paper-3, --pfbox-paper-line, --pfbox-flap-hi, --pfbox-crease;
  }

  .pfbox[data-theme='dark'] {
    --pfbox-bg: #17130f;
    --pfbox-ink: #0b0907;
    --pfbox-focus: #f3e6d3;
    --pfbox-grain-blend: screen;
    --pfbox-grain-o: 0.07;

    --pfbox-face-front-1: #4a3f33;
    --pfbox-face-front-2: #3b3228;
    --pfbox-face-side-1: #352c23;
    --pfbox-face-side-2: #2a231c;
    --pfbox-rim: #5e5142;
    --pfbox-hollow-1: #15110d;
    --pfbox-hollow-2: #050403;
    --pfbox-hollow-side-1: #060504;
    --pfbox-hollow-side-2: #110e0b;
    --pfbox-hole: #0b0907;
    --pfbox-shadow-wide: #000000;
    --pfbox-shadow-wide-o: 0.55;
    --pfbox-shadow-tight: #000000;
    --pfbox-shadow-tight-o: 0.6;
    --pfbox-occ: #000000;
    --pfbox-occ-o: 0.6;

    --pfbox-green-f: #1e8f55;
    --pfbox-green-b: #13663a;
    --pfbox-beige-f: #cdb896;
    --pfbox-beige-b: #a88f69;
    --pfbox-pink-f: #c98fd0;
    --pfbox-pink-b: #a56fad;
    --pfbox-orange-f: #d99520;
    --pfbox-orange-b: #b0750c;
    --pfbox-paper-1: #e6dfd2;
    --pfbox-paper-2: #cfc7b8;
    --pfbox-paper-3: #eee8dd;
    --pfbox-paper-line: #9c917f;
    --pfbox-flap-hi: rgb(255 255 255 / 0.18);
    --pfbox-crease: rgb(0 0 0 / 0.3);
  }

  /* filling its container: the field is the whole box and the scene centres in it */
  .pfbox[data-fill] {
    height: 100%;
    aspect-ratio: auto;
  }

  .pfbox__poster {
    position: relative;
    width: min(100cqw, 100cqh);
    aspect-ratio: 1;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .pfbox[data-ready] .pfbox__poster {
    opacity: 1;
  }

  .pfbox__art {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    stroke: var(--pfbox-ink);
  }

  .pfbox__grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    mix-blend-mode: var(--pfbox-grain-blend);
    opacity: var(--pfbox-grain-o);
  }

  .pfbox__hit {
    cursor: pointer;
    outline: none;
  }

  .pfbox__hit:focus-visible .pfbox__hitBase {
    stroke: var(--pfbox-focus);
    stroke-width: 2;
    stroke-dasharray: 5 5;
    stroke-opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .pfbox,
    .pfbox__poster {
      transition: none;
    }
  }
</style>
