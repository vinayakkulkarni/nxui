<script setup lang="ts">
  // Vue port of Desk Computer from Pin UI (https://pinui.xyz), MIT licence.
  import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { mountDeskComputer, parseSvg } from './desk-computer-engine';
  import type {
    DeskComputerLoadState,
    DeskComputerProps,
    DeskEngine,
  } from './types';

  /**
   * An isometric late-90s desk computer you can use. The drawing is ~490KB of
   * SVG, so it is fetched at mount (from `src`) rather than shipped in the
   * bundle; desk-computer-engine.ts is everything it does.
   */
  const props = withDefaults(defineProps<DeskComputerProps>(), {
    theme: 'light',
    sound: true,
    fill: false,
    src: '/library/desk-computer.svg',
    class: '',
  });

  const stageEl = useTemplateRef<HTMLDivElement>('stageEl');
  const artEl = useTemplateRef<HTMLDivElement>('artEl');
  const statusEl = useTemplateRef<HTMLSpanElement>('statusEl');
  const state = ref<DeskComputerLoadState>('loading');

  let engine: DeskEngine | null = null;
  let abort: AbortController | null = null;
  let visible = false;

  function teardown(): void {
    abort?.abort();
    abort = null;
    engine?.destroy();
    engine = null;
    artEl.value?.replaceChildren();
  }

  /* fetch the drawing, inline it, and start the engine on it */
  async function load(): Promise<void> {
    teardown();
    const stage = stageEl.value;
    const art = artEl.value;
    const status = statusEl.value;
    if (!stage || !art || !status) return;
    const controller = new AbortController();
    abort = controller;
    state.value = 'loading';
    try {
      const response = await fetch(props.src, { signal: controller.signal });
      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}`);
      const markup = await response.text();
      if (controller.signal.aborted) return;
      const svg = parseSvg(markup);
      if (!svg) throw new Error('the drawing has no <svg>');
      art.replaceChildren(svg);
      engine = mountDeskComputer({ stage, svg, status, muted: !props.sound });
      engine.setVisible(visible);
      state.value = 'ready';
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      console.error('[DeskComputer]', error);
      state.value = 'failed';
    }
  }

  useIntersectionObserver(
    stageEl,
    (entries) => {
      const entry = entries[entries.length - 1];
      visible = entry?.isIntersecting ?? false;
      engine?.setVisible(visible);
    },
    { rootMargin: '120px 0px' },
  );

  onMounted(load);
  onBeforeUnmount(teardown);

  watch(
    () => props.src,
    () => {
      void load();
    },
  );

  watch(
    () => props.sound,
    (sound) => engine?.setMuted(!sound),
  );

  /* the system assembles itself again under the new light */
  watch(
    () => props.theme,
    () => engine?.replayIntro(),
  );
</script>

<template>
  <div
    :class="cn('pdesk', props.class)"
    :data-theme="theme"
    :data-fill="fill || undefined"
    :data-ready="state === 'ready' || undefined"
  >
    <div
      ref="stageEl"
      class="pdesk__stage"
      tabindex="0"
      role="group"
      aria-label="Desk computer. Type to search on its screen; Enter searches; Escape or the monitor's power button switches the screen. Drag the mouse; click the CD to load it."
    >
      <div ref="artEl"></div>
      <span
        ref="statusEl"
        class="pdesk__sr"
        role="status"
        aria-live="polite"
      ></span>
    </div>
    <p v-if="state === 'failed'" class="pdesk__error">
      The drawing couldn&rsquo;t be loaded from {{ src }}.
    </p>
  </div>
</template>

<style>
  /* The component's own layout first; after it, the figure's rules — the
     Anatomy kit's isometric styles (MIT, © 2026 Ryan) and the figure's
     materials, live parts and assembly — every one scoped to .pdesk. Every
     colour is a token with a value for each theme, set on data-theme. The
     drawing is injected at runtime, so these rules are not scoped. */

  .pdesk {
    position: relative;
    isolation: isolate;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1000 / 760;
    max-height: 80vh;
    overflow: hidden;
    container-type: size;
    background: var(--anatomy-page);
    color: var(--anatomy-text);
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.35s ease;
  }

  .pdesk[data-fill] {
    height: 100%;
    aspect-ratio: auto;
    max-height: none;
  }

  .pdesk__stage {
    position: relative;
    width: min(1120px, 100cqw - 32px, (100cqh - 88px) * 1000 / 760);
    aspect-ratio: 1000 / 760;
    outline: none;
    touch-action: pan-y;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .pdesk[data-ready] .pdesk__stage {
    opacity: 1;
  }

  .pdesk__error {
    margin: 0;
    padding: 24px;
    max-width: 34em;
    color: var(--anatomy-text);
    font: inherit;
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
  }

  .pdesk__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .pdesk,
    .pdesk__stage {
      transition: none;
    }
  }

  .pdesk {
    --anatomy-page: #0b0b0b;
    --anatomy-card: #131313;
    --anatomy-text: #a3a3a3;
    --anatomy-strong: #e6e6e6;
    --anatomy-muted: #6e6e6e;
    --anatomy-paper: #131313;
    --anatomy-face: #1b1b1b;
    --anatomy-top: #1c1c1c;
    --anatomy-shade-0: #0f0f0f;
    --anatomy-shade-1: #121212;
    --anatomy-shade-2: #151515;
    --anatomy-shade-3: #181818;
    --anatomy-lit-top: #262626;
    --anatomy-lit-shade: #1d1d1d;
    --anatomy-hi: #d4d4d4;
    --anatomy-mid: #6a6a6a;
    --anatomy-lo: #3e3e3e;
    --anatomy-faint: #2a2a2a;
    --anatomy-lit: #ffffff;
    --anatomy-halo: #050505;
    --anatomy-halo-opacity: 0.9;
    --anatomy-dot: #e6e6e6;
    --anatomy-red: #ff6b6b;
    --anatomy-green: #6be0a0;
    --anatomy-blue: #6b9bff;
    --anatomy-weight: 1.05px;
    --anatomy-ease: cubic-bezier(0.32, 0.72, 0, 1);
  }
  .pdesk[data-theme='light'] {
    --anatomy-page: #ffffff;
    --anatomy-card: #ffffff;
    --anatomy-paper: #ffffff;
    --anatomy-face: #ffffff;
    --anatomy-top: #fbfbfd;
    --anatomy-strong: #18181a;
    --anatomy-shade-0: #c9cbd7;
    --anatomy-shade-1: #d6d8e2;
    --anatomy-shade-2: #e3e5ec;
    --anatomy-shade-3: #eff0f4;
    --anatomy-lit-top: #ffffff;
    --anatomy-lit-shade: #eeeeeb;
    --anatomy-hi: #3b3e4b;
    --anatomy-mid: #717484;
    --anatomy-lo: #9fa2b0;
    --anatomy-faint: #cdcfd8;
    --anatomy-lit: #111;
    --anatomy-halo: #8f92a3;
    --anatomy-halo-opacity: 0.38;
    --anatomy-dot: #3b3e4b;
    --anatomy-red: #d9473f;
    --anatomy-green: #30a46c;
    --anatomy-blue: #3e63dd;
    --anatomy-text: #57575a;
    --anatomy-muted: #8c8c90;
    --pc-pad: #8f86f2;
    --pc-pad-top: #9a92f6;
    --pc-pad-0: #6c62d4;
    --pc-pad-1: #776ddd;
    --pc-pad-2: #8278e6;
    --pc-pad-3: #8c83ee;
    --pc-pad-badge: #a59ef8;
    --pc-dark: #5d6070;
    --pc-dark-top: #6a6d7d;
    --pc-dark-0: #3f4252;
    --pc-dark-1: #474a5a;
    --pc-dark-2: #505364;
    --pc-dark-3: #585b6b;
    --pc-disk: #d4d6df;
    --pc-disk-top: #dcdee6;
    --pc-disk-0: #a9acba;
    --pc-disk-1: #b4b7c4;
    --pc-disk-2: #bfc2ce;
    --pc-disk-3: #c9cbd6;
    --pc-shell: #e9eaf0;
    --pc-shell-top: #eff0f4;
    --pc-shell-0: #bfc1cd;
    --pc-shell-1: #cbcdd8;
    --pc-shell-2: #d6d8e1;
    --pc-shell-3: #e0e2e9;
    --pc-glass: #5f6272;
    --pc-glass-off: #4d505f;
    --pc-desk: #7a7d8e;
    --pc-window: #f4f5f8;
    --pc-titlebar: #4a6cf0;
    --pc-cap: #e6e7ee;
    --pc-search: #d9dbe4;
    --pc-input: #ffffff;
    --pc-ink: #3b3e4b;
    --pc-glare: rgba(255, 255, 255, 0.35);
    --pc-button: #f6f7fa;
    --pc-sticker: #f4f5f8;
    --pc-label: #ffffff;
    --pc-metal: #eceef3;
    --pc-hole: #9ea1b0;
    --pc-grille: #6d6b84;
    --pc-driver: #5c5a73;
    --pc-cone: #77758f;
    --pc-dust: #8c8aa4;
    --pc-disc: #eceef3;
    --pc-disc-sheen: #ffffff;
    --pc-hub: #f8f9fb;
    --pc-print: #9fa2b0;
    --pc-led-off: #d9d4c8;
    color-scheme: light;
  }
  .pdesk[data-theme='dark'] {
    --anatomy-page: #0f1013;
    --anatomy-card: #0f1013;
    --anatomy-paper: #17181d;
    --anatomy-face: #1c1d23;
    --anatomy-top: #24262d;
    --anatomy-shade-0: #0e0f13;
    --anatomy-shade-1: #121318;
    --anatomy-shade-2: #16171d;
    --anatomy-shade-3: #1b1c22;
    --anatomy-hi: #c9ccd8;
    --anatomy-mid: #80838f;
    --anatomy-lo: #4f525e;
    --anatomy-faint: #30323b;
    --anatomy-lit: #fff;
    --anatomy-halo: #000000;
    --anatomy-halo-opacity: 0.8;
    --anatomy-dot: #c9ccd8;
    --anatomy-red: #f0675f;
    --anatomy-text: #a3a3a8;
    --anatomy-muted: #6e6f76;
    --pc-pad: #5a52c2;
    --pc-pad-top: #665ecf;
    --pc-pad-0: #3a3388;
    --pc-pad-1: #423b96;
    --pc-pad-2: #4a43a4;
    --pc-pad-3: #524bb2;
    --pc-pad-badge: #7a72e0;
    --pc-dark: #2a2c34;
    --pc-dark-top: #32343d;
    --pc-dark-0: #1b1c22;
    --pc-dark-1: #1f2027;
    --pc-dark-2: #23252c;
    --pc-dark-3: #272930;
    --pc-disk: #3a3c46;
    --pc-disk-top: #42444f;
    --pc-disk-0: #26272e;
    --pc-disk-1: #2b2c34;
    --pc-disk-2: #30323a;
    --pc-disk-3: #353741;
    --pc-shell: #20222a;
    --pc-shell-top: #262830;
    --pc-shell-0: #111217;
    --pc-shell-1: #15161c;
    --pc-shell-2: #191a20;
    --pc-shell-3: #1d1f25;
    --pc-glass: #0b0c10;
    --pc-glass-off: #08090c;
    --pc-desk: #1a1c23;
    --pc-window: #e9ebf2;
    --pc-titlebar: #3d5ee8;
    --pc-cap: #d7d9e2;
    --pc-search: #c9ccd6;
    --pc-input: #fbfbfd;
    --pc-ink: #2b2d36;
    --pc-glare: rgba(255, 255, 255, 0.18);
    --pc-button: #22242b;
    --pc-sticker: #e6e7ec;
    --pc-label: #e6e7ec;
    --pc-metal: #8a8d99;
    --pc-hole: #4d505c;
    --pc-grille: #2c2b38;
    --pc-driver: #24232f;
    --pc-cone: #33323f;
    --pc-dust: #403f4e;
    --pc-disc: #9a9da9;
    --pc-disc-sheen: #c3c6d0;
    --pc-hub: #b4b7c2;
    --pc-print: #5e616d;
    --pc-led-off: #3a3a3e;
    color-scheme: dark;
  }

  /* the kit's isometric styles */
  .pdesk .iso-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .pdesk .iso-svg path,
  .pdesk .iso-svg circle {
    vector-effect: non-scaling-stroke;
  }
  .pdesk .iso-fill {
    fill: var(--anatomy-paper);
    stroke: none;
  }
  .pdesk .iso-solid[data-lit] > .iso-fill {
    fill: var(--anatomy-face);
  }
  .pdesk .iso-shade,
  .pdesk .iso-top {
    stroke: none;
  }
  .pdesk .iso-shade[data-shade='0'] {
    fill: var(--anatomy-shade-0);
  }
  .pdesk .iso-shade[data-shade='1'] {
    fill: var(--anatomy-shade-1);
  }
  .pdesk .iso-shade[data-shade='2'] {
    fill: var(--anatomy-shade-2);
  }
  .pdesk .iso-shade[data-shade='3'] {
    fill: var(--anatomy-shade-3);
  }
  .pdesk .iso-top {
    fill: var(--anatomy-top);
  }
  .pdesk .iso-solid[data-lit] > .iso-top {
    fill: var(--anatomy-lit-top);
  }
  .pdesk .iso-solid[data-lit] > .iso-shade {
    fill: var(--anatomy-lit-shade);
  }
  .pdesk .iso-solid[data-seamless] > .iso-shade,
  .pdesk .iso-solid[data-seamless] > .iso-top {
    stroke-width: 0.4;
    stroke-linejoin: round;
  }
  .pdesk .iso-solid[data-seamless] > .iso-shade[data-shade='0'] {
    stroke: var(--anatomy-shade-0);
  }
  .pdesk .iso-solid[data-seamless] > .iso-shade[data-shade='1'] {
    stroke: var(--anatomy-shade-1);
  }
  .pdesk .iso-solid[data-seamless] > .iso-shade[data-shade='2'] {
    stroke: var(--anatomy-shade-2);
  }
  .pdesk .iso-solid[data-seamless] > .iso-shade[data-shade='3'] {
    stroke: var(--anatomy-shade-3);
  }
  .pdesk .iso-solid[data-seamless] > .iso-top {
    stroke: var(--anatomy-top);
  }
  .pdesk .iso-solid[data-seamless][data-lit] > .iso-top {
    stroke: var(--anatomy-lit-top);
  }
  .pdesk .iso-solid[data-seamless][data-lit] > .iso-shade {
    stroke: var(--anatomy-lit-shade);
  }
  .pdesk .iso-solid[data-lit] > .iso-edge {
    stroke: var(--anatomy-lit);
  }
  .pdesk .iso-halo {
    fill: var(--anatomy-halo);
    stroke: none;
    filter: blur(7px);
    opacity: var(--anatomy-halo-opacity);
    transform: translate(6px, 7px);
  }
  .pdesk .iso-line {
    fill: none;
    stroke: var(--anatomy-lo);
    stroke-width: var(--anatomy-weight);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .pdesk .iso-line[data-tone='hi'] {
    stroke: var(--anatomy-hi);
  }
  .pdesk .iso-line[data-tone='mid'] {
    stroke: var(--anatomy-mid);
  }
  .pdesk .iso-line[data-tone='lo'] {
    stroke: var(--anatomy-lo);
  }
  .pdesk .iso-line[data-tone='faint'] {
    stroke: var(--anatomy-faint);
  }
  .pdesk .iso-line[data-tone='lit'] {
    stroke: var(--anatomy-lit);
  }
  .pdesk .iso-line[data-tone='red'] {
    stroke: var(--anatomy-red);
  }
  .pdesk .iso-line[data-tone='green'] {
    stroke: var(--anatomy-green);
  }
  .pdesk .iso-line[data-tone='blue'] {
    stroke: var(--anatomy-blue);
  }
  .pdesk .iso-line[data-dotted] {
    stroke-dasharray: 0.01 3.5;
    stroke-width: 1;
  }
  .pdesk .iso-line[data-dashed] {
    stroke-dasharray: 3 3;
  }
  .pdesk .iso-line[data-flow] {
    stroke-dasharray: 2 6;
    animation: pdesk-flow 1600ms linear infinite;
  }
  .pdesk .iso-line.iso-crease,
  .pdesk .iso-line.iso-bevel {
    stroke-width: 0.7px;
  }
  .pdesk .iso-line[data-tone='faint'],
  .pdesk .iso-line[data-tone='lo'] {
    stroke-width: 0.8px;
  }
  .pdesk .tb-body {
    fill: var(--anatomy-shade-2);
    stroke: none;
  }
  .pdesk .tb-shine {
    fill: var(--anatomy-top);
    stroke: none;
  }
  .pdesk .tb-shade {
    fill: var(--anatomy-shade-0);
    stroke: none;
  }
  .pdesk .tb-ring {
    fill: none;
    stroke: var(--anatomy-lo);
    stroke-width: 0.45;
    stroke-linecap: butt;
    stroke-linejoin: round;
  }
  .pdesk .tb-ring[data-tone='mid'] {
    stroke: var(--anatomy-mid);
  }
  .pdesk .tb-ring[data-tone='faint'] {
    stroke: var(--anatomy-faint);
  }
  .pdesk .tb-ring[data-tone='hi'] {
    stroke: var(--anatomy-hi);
  }
  @keyframes pdesk-flow {
    to {
      stroke-dashoffset: -32;
    }
  }

  /* the figure's own rules */
  .pdesk .pdesk__stage svg text {
    pointer-events: none;
  }
  .pdesk .pdesk__stage:focus-visible:not([data-pointer]) {
    outline: 1px dashed var(--anatomy-lo);
    outline-offset: 6px;
    border-radius: 4px;
  }
  .pdesk .m-pad {
    --anatomy-paper: var(--pc-pad);
    --anatomy-face: var(--pc-pad);
    --anatomy-top: var(--pc-pad-top);
    --anatomy-shade-0: var(--pc-pad-0);
    --anatomy-shade-1: var(--pc-pad-1);
    --anatomy-shade-2: var(--pc-pad-2);
    --anatomy-shade-3: var(--pc-pad-3);
  }
  .pdesk .m-dark {
    --anatomy-paper: var(--pc-dark);
    --anatomy-face: var(--pc-dark);
    --anatomy-top: var(--pc-dark-top);
    --anatomy-shade-0: var(--pc-dark-0);
    --anatomy-shade-1: var(--pc-dark-1);
    --anatomy-shade-2: var(--pc-dark-2);
    --anatomy-shade-3: var(--pc-dark-3);
  }
  .pdesk .m-disk {
    --anatomy-paper: var(--pc-disk);
    --anatomy-face: var(--pc-disk);
    --anatomy-top: var(--pc-disk-top);
    --anatomy-shade-0: var(--pc-disk-0);
    --anatomy-shade-1: var(--pc-disk-1);
    --anatomy-shade-2: var(--pc-disk-2);
    --anatomy-shade-3: var(--pc-disk-3);
  }
  .pdesk .m-shell {
    --anatomy-paper: var(--pc-shell);
    --anatomy-face: var(--pc-shell);
    --anatomy-top: var(--pc-shell-top);
    --anatomy-shade-0: var(--pc-shell-0);
    --anatomy-shade-1: var(--pc-shell-1);
    --anatomy-shade-2: var(--pc-shell-2);
    --anatomy-shade-3: var(--pc-shell-3);
  }
  .pdesk .pc-glass {
    fill: var(--pc-glass);
  }
  .pdesk .pc-desk {
    fill: var(--pc-desk);
  }
  .pdesk .pc-window {
    fill: var(--pc-window);
  }
  .pdesk .pc-titlebar {
    fill: var(--pc-titlebar);
  }
  .pdesk .pc-titlebar-fade {
    fill: url(#pc-title-grad);
  }
  .pdesk .pc-cap {
    fill: var(--pc-cap);
  }
  .pdesk .pc-icon {
    stroke-width: 0.9px;
  }
  .pdesk .pc-logo {
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .pdesk .pc-search {
    fill: var(--pc-search);
  }
  .pdesk .pc-input {
    fill: var(--pc-input);
  }
  .pdesk .pc-query {
    fill: var(--pc-ink);
    font-family: Arial, Helvetica, sans-serif;
  }
  .pdesk .pc-caret {
    fill: var(--pc-ink);
    animation: pdesk-blink 1.06s steps(1, end) infinite;
  }
  .pdesk .pc-glare {
    fill: none;
    stroke: var(--pc-glare);
    stroke-width: 1px;
    stroke-linecap: round;
  }
  .pdesk .pc-beam {
    fill: none;
    stroke: #e9ecff;
    stroke-width: 1.6px;
    stroke-linecap: round;
  }
  .pdesk .pc-dot {
    fill: #f2f4ff;
  }
  .pdesk .pc-led-blue {
    fill: #4a6cf0;
  }
  .pdesk .pc-led-green {
    fill: #3ec46d;
  }
  .pdesk .pc-led-amber {
    fill: var(--pc-led-off);
    transition: fill 0.08s;
  }
  .pdesk .pc-led-amber[data-on] {
    fill: #f2a33a;
  }
  .pdesk .pc-button {
    fill: var(--pc-button);
  }
  .pdesk .pc-power,
  .pdesk .pc-key {
    cursor: pointer;
  }
  .pdesk .pc-intel {
    fill: #2f6fe0;
  }
  .pdesk .pc-intel-swoosh {
    fill: none;
    stroke: #fff;
    stroke-width: 0.5px;
  }
  .pdesk .pc-intel-text {
    fill: #fff;
    font:
      700 2.6px/1 Arial,
      Helvetica,
      sans-serif;
  }
  .pdesk .pc-badge {
    fill: var(--pc-sticker);
  }
  .pdesk .pc-badge-text {
    fill: #3b3e4b;
    font:
      700 2.2px/1 Arial,
      Helvetica,
      sans-serif;
  }
  .pdesk .pc-flag-r {
    fill: #e5483f;
  }
  .pdesk .pc-flag-g {
    fill: #3ab05b;
  }
  .pdesk .pc-flag-b {
    fill: #3a74e8;
  }
  .pdesk .pc-flag-y {
    fill: #f2b928;
  }
  .pdesk .pc-grille {
    fill: var(--pc-grille);
  }
  .pdesk .pc-driver {
    fill: var(--pc-driver);
  }
  .pdesk .pc-cone {
    fill: var(--pc-cone);
  }
  .pdesk .pc-cap-dust {
    fill: var(--pc-dust);
  }
  .pdesk .pc-metal {
    fill: var(--pc-metal);
  }
  .pdesk .pc-disk-hole {
    fill: var(--pc-hole);
  }
  .pdesk .pc-label {
    fill: var(--pc-label);
  }
  .pdesk .pc-pad-badge {
    fill: var(--pc-pad-badge);
  }
  .pdesk .pc-disc {
    fill: var(--pc-disc);
  }
  .pdesk .pc-disc-sheen {
    fill: var(--pc-disc-sheen);
    opacity: 0.85;
  }
  .pdesk .pc-hub {
    fill: var(--pc-hub);
  }
  .pdesk .pc-cd-text,
  .pdesk .pc-cd-small {
    fill: var(--pc-print);
    font-family: Arial, Helvetica, sans-serif;
    letter-spacing: 0.04em;
  }
  .pdesk .pc-key[data-down] .iso-top {
    fill: var(--anatomy-shade-3);
  }
  @keyframes pdesk-blink {
    50% {
      opacity: 0;
    }
  }
  .pdesk .pc-hit {
    fill: transparent;
    cursor: pointer;
  }
  .pdesk [data-part='cd-case'],
  .pdesk [data-part='cd-tray'] {
    cursor: pointer;
  }
  .pdesk [data-part='mouse'] {
    cursor: grab;
  }
  .pdesk .pdesk__stage[data-dragging],
  .pdesk .pdesk__stage[data-dragging] [data-part='mouse'] {
    cursor: grabbing;
  }
  .pdesk .pc-livecable path {
    fill: none;
    vector-effect: none;
    stroke-linecap: butt;
    stroke-linejoin: round;
  }
  .pdesk .pc-cable-o {
    stroke: var(--anatomy-hi);
  }
  .pdesk .pc-cable-i {
    stroke: var(--anatomy-shade-2);
  }
  .pdesk .pc-cable-s {
    stroke: var(--anatomy-top);
  }
  .pdesk .pc-arrow {
    fill: #fff;
    stroke: #1d1f27;
    stroke-width: 0.35px;
    vector-effect: none;
    stroke-linejoin: round;
  }
  .pdesk .pc-ibeam {
    fill: none;
    stroke: #1d1f27;
    stroke-width: 0.45px;
    vector-effect: none;
  }
  .pdesk .pc-slot {
    fill: var(--pc-glass-off);
  }
  .pdesk .pc-ap-shadow {
    fill: rgba(20, 22, 30, 0.18);
  }
  .pdesk .pc-ap-title {
    fill: #fff;
    font:
      700 2.6px/1 Arial,
      Helvetica,
      sans-serif;
  }
  .pdesk .pc-ap-head {
    fill: var(--pc-ink);
    font:
      700 3.3px/1 Arial,
      Helvetica,
      sans-serif;
  }
  .pdesk .pc-ap-body {
    fill: #5d6070;
    font:
      400 2.3px/1 Arial,
      Helvetica,
      sans-serif;
  }
  .pdesk .pc-ap-disc {
    fill: #e3e5ec;
    stroke: #5d6070;
    stroke-width: 0.3px;
    vector-effect: none;
  }
  .pdesk .pc-ap-ring {
    fill: #f6f7fa;
    stroke: #8a8d99;
    stroke-width: 0.25px;
    vector-effect: none;
  }
  .pdesk .pc-ap-hole {
    fill: #5d6070;
  }
  .pdesk .pc-ap-shine {
    fill: none;
    stroke: #fff;
    stroke-width: 0.8px;
    vector-effect: none;
    stroke-linecap: round;
  }
  .pdesk .pc-led-cd {
    fill: var(--pc-led-off);
    transition: fill 0.08s;
  }
  .pdesk .pc-led-cd[data-on] {
    fill: #3ec46d;
  }

  /* the assembly */
  @keyframes pdesk-in {
    0% {
      opacity: 0;
      transform: translateY(-18px);
    }
    22% {
      opacity: 1;
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes pdesk-fade {
    from {
      opacity: 0;
    }
  }
  .pdesk .pdesk--intro .it {
    animation: pdesk-in 0.72s cubic-bezier(0.2, 0.9, 0.28, 1.12) backwards;
    animation-delay: var(--d);
  }
  .pdesk .pdesk--intro .it[data-obj='key'] {
    animation-duration: 0.5s;
  }
  .pdesk .pdesk--intro .it[data-obj='cable'] {
    animation: pdesk-fade 0.32s ease-out backwards;
    animation-delay: var(--d);
  }
  .pdesk .pdesk--intro .pc-halos {
    animation: pdesk-fade 0.9s ease-out backwards 0.15s;
  }

  @media (prefers-reduced-motion: reduce) {
    .pdesk .iso-line[data-flow],
    .pdesk .pc-caret,
    .pdesk .pdesk--intro .it,
    .pdesk .pdesk--intro .it[data-obj='cable'],
    .pdesk .pdesk--intro .pc-halos {
      animation: none;
    }
  }
</style>
