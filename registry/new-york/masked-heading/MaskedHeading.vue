<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    SPOT_MASK,
    clamp,
    easeExpoOut,
    easeInOut3,
    easeOut2,
    easeOut3,
    easeOut4,
    progressAt,
  } from './masked-heading-motion';
  import type {
    MaskedHeadingGlyph,
    MaskedHeadingGlyphBox,
    MaskedHeadingGlyphState,
    MaskedHeadingOffset,
    MaskedHeadingProps,
    MaskedHeadingTimeline,
  } from './types';

  const props = withDefaults(defineProps<MaskedHeadingProps>(), {
    text: 'Designed in the details',
    tag: 'h2',
    mediaType: 'image',
    src: '',
    poster: '',
    fillScale: 1.25,
    parallax: 26,
    drift: 18,
    hoverZoom: 0,
    brightness: 1,
    saturation: 1,
    grayscale: false,
    tint: '',
    spotlight: false,
    spotlightRadius: 160,
    outline: false,
    outlineColor: '',
    outlineWidth: 1,
    reveal: 'rise',
    duration: 1.1,
    stagger: 0.09,
    trigger: 'view',
    align: 'center',
    weight: 700,
    tracking: -0.03,
    lineHeight: 1.06,
    textScale: 0.115,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLElement>('root');
  const measureRef = useTemplateRef<HTMLSpanElement>('measure');
  const revealRef = useTemplateRef<HTMLSpanElement>('reveal');
  const clipRef = useTemplateRef<HTMLSpanElement>('clip');
  const mediaRef = useTemplateRef<HTMLSpanElement>('media');

  const wordEls: (HTMLSpanElement | null)[] = [];
  const baseEls: (HTMLElement | null)[] = [];
  const glyphEls: (SVGTextElement | null)[] = [];
  const lineEls: (SVGTextElement | null)[] = [];

  function setWord(el: Element | ComponentPublicInstance | null, i: number) {
    wordEls[i] = el instanceof HTMLSpanElement ? el : null;
  }
  function setBase(el: Element | ComponentPublicInstance | null, i: number) {
    baseEls[i] = el instanceof HTMLElement ? el : null;
  }
  function setGlyph(el: Element | ComponentPublicInstance | null, i: number) {
    glyphEls[i] = el instanceof SVGTextElement ? el : null;
  }
  function setLine(el: Element | ComponentPublicInstance | null, i: number) {
    lineEls[i] = el instanceof SVGTextElement ? el : null;
  }

  const clipId = `mh-${useId().replace(/[^\w-]/g, '')}`;
  const words = computed(() => props.text.split(/\s+/).filter(Boolean));
  const glyphs = computed<MaskedHeadingGlyph[]>(() =>
    words.value.flatMap((word, w) =>
      Array.from(word).map((char) => ({ char, w })),
    ),
  );

  const rootStyle = computed(() => ({
    textAlign: props.align,
    fontWeight: props.weight,
    letterSpacing: `${props.tracking}em`,
    lineHeight: props.lineHeight,
  }));
  const clipStyle = computed(() => ({
    clipPath: `url(#${clipId})`,
    '--mh-spot-r': `${Math.max(1, props.spotlightRadius)}px`,
  }));
  const spotStyle = { maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK };
  const outlineStyle = computed(() => ({
    stroke: props.outlineColor || 'currentColor',
    strokeWidth: Math.max(0, props.outlineWidth),
  }));

  let boxes: MaskedHeadingGlyphBox[] = [];
  let states: MaskedHeadingGlyphState[] = [];
  const off: MaskedHeadingOffset = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    zoom: 0,
    px: 0,
    py: 0,
    sx: 0,
    sy: 0,
    lit: false,
  };
  const paint = { transform: '', filter: '', spot: '' };

  const reducedMotion = usePreferredReducedMotion();
  const still = computed(() => reducedMotion.value === 'reduce');

  // ---- painting --------------------------------------------------------------
  function place() {
    const root = rootRef.value;
    const media = mediaRef.value;
    if (!root || !media) return;
    const scale = props.fillScale * (1 + Math.max(0, off.zoom));
    const maxX = Math.max(0, ((scale - 1) / 2) * root.clientWidth);
    const maxY = Math.max(0, ((scale - 1) / 2) * root.clientHeight);
    const transform = `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    const filter = `brightness(${props.brightness}) saturate(${props.saturation})${props.grayscale ? ' grayscale(1)' : ''}`;
    if (paint.transform !== transform) {
      paint.transform = transform;
      media.style.transform = transform;
    }
    if (paint.filter !== filter) {
      paint.filter = filter;
      media.style.filter = filter;
    }
    const clip = clipRef.value;
    if (clip && props.spotlight) {
      const spot = `${off.sx.toFixed(1)}px ${off.sy.toFixed(1)}px`;
      if (paint.spot !== spot) {
        paint.spot = spot;
        clip.style.setProperty('--mh-spot-x', `${off.sx.toFixed(1)}px`);
        clip.style.setProperty('--mh-spot-y', `${off.sy.toFixed(1)}px`);
      }
    }
  }

  function renderGlyphs() {
    for (let i = 0; i < glyphEls.length; i += 1) {
      const glyph = glyphEls[i];
      if (!glyph) continue;
      const box = boxes[i];
      const st = states[i];
      if (!box || !st || (st.x === 0 && st.y === 0 && st.s === 1)) {
        if (glyph.hasAttribute('transform')) glyph.removeAttribute('transform');
        continue;
      }
      const s = Math.max(st.s, 0.0001);
      const tx = box.cx * (1 - s) + st.x * (box.cx - box.lc);
      const ty = box.cy * (1 - s) + st.y;
      glyph.setAttribute(
        'transform',
        `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`,
      );
    }
  }

  // ---- measurement -----------------------------------------------------------
  function sync() {
    const root = rootRef.value;
    const measure = measureRef.value;
    if (!root || !measure) return;
    root.style.fontSize = `${clamp(root.clientWidth * props.textScale, 20, 200).toFixed(1)}px`;

    const cs = window.getComputedStyle(measure);
    const fontPx = Number.parseFloat(cs.fontSize) || 48;
    const rootRect = root.getBoundingClientRect();
    const ratio = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
    const range = document.createRange();
    const next: MaskedHeadingGlyphBox[] = [];
    let index = 0;

    for (let w = 0; w < words.value.length; w += 1) {
      const box = wordEls[w];
      const base = baseEls[w];
      const node = box?.firstElementChild?.firstChild;
      if (!box || !base || !(node instanceof Text)) {
        index += Array.from(box?.textContent ?? '').length;
        continue;
      }
      const boxRect = box.getBoundingClientRect();
      const baseline = base.offsetTop;
      let offset = 0;
      for (const char of Array.from(node.data)) {
        range.setStart(node, offset);
        range.setEnd(node, offset + char.length);
        offset += char.length;
        const r = range.getBoundingClientRect();
        const x = box.offsetLeft + (r.left - boxRect.left) / ratio;
        const width = r.width / ratio;
        next[index] = {
          x,
          y: baseline,
          w: width,
          cx: x + width / 2,
          cy: baseline - fontPx * 0.36,
          lc: 0,
        };
        index += 1;
      }
    }
    const lines = new Map<number, { left: number; right: number }>();
    for (const box of next) {
      if (!box) continue;
      const line = lines.get(box.y) ?? { left: Infinity, right: -Infinity };
      line.left = Math.min(line.left, box.x);
      line.right = Math.max(line.right, box.x + box.w);
      lines.set(box.y, line);
    }
    for (const box of next) {
      if (!box) continue;
      const line = lines.get(box.y);
      if (line) box.lc = (line.left + line.right) / 2;
    }
    boxes = next;

    for (let i = 0; i < next.length; i += 1) {
      const box = next[i];
      if (!box) continue;
      for (const el of [glyphEls[i], lineEls[i]]) {
        if (!el) continue;
        el.setAttribute('x', box.x.toFixed(2));
        el.setAttribute('y', `${box.y}`);
        el.style.fontFamily = cs.fontFamily;
        el.style.fontSize = cs.fontSize;
        el.style.fontWeight = cs.fontWeight;
        el.style.fontStyle = cs.fontStyle;
        el.style.letterSpacing = cs.letterSpacing;
      }
    }
    renderGlyphs();
    place();
  }

  // ---- idle drift, parallax and spotlight ------------------------------------
  let clock = 0;
  let hovering = false;
  const visible = { value: true };

  function frame(dt: number) {
    const root = rootRef.value;
    if (!root) return;
    if (still.value) {
      off.x = 0;
      off.y = 0;
      off.zoom = 0;
    } else {
      clock += dt;
      const dx = Math.sin(clock * 0.21) * props.drift;
      const dy = Math.cos(clock * 0.17) * props.drift * 0.6;
      const ease = 1 - Math.exp(-dt / 0.18);
      off.x += (off.tx + dx - off.x) * ease;
      off.y += (off.ty + dy - off.y) * ease;
      off.zoom +=
        ((hovering ? props.hoverZoom : 0) - off.zoom) *
        (1 - Math.exp(-dt / 0.35));
    }

    if (props.spotlight) {
      const w = root.clientWidth;
      const h = root.clientHeight;
      let gx = w / 2;
      let gy = h / 2;
      if (hovering) {
        gx = off.px;
        gy = off.py;
      } else if (!still.value) {
        gx = w * (0.5 + 0.36 * Math.sin(clock * 0.37));
        gy = h * (0.5 + 0.22 * Math.sin(clock * 0.61 + 0.9));
      }
      if (!off.lit || still.value) {
        off.sx = gx;
        off.sy = gy;
        off.lit = true;
      } else {
        const follow = 1 - Math.exp(-dt / (hovering ? 0.12 : 0.6));
        off.sx += (gx - off.sx) * follow;
        off.sy += (gy - off.sy) * follow;
      }
    } else {
      off.lit = false;
    }
    place();
  }

  const idleLoop = useRafFn(
    ({ delta }) => {
      frame(Math.min(0.05, delta / 1000));
      if (!visible.value || still.value) idleLoop.pause();
    },
    { immediate: false },
  );

  function wake() {
    if (still.value || !visible.value) {
      frame(0);
      return;
    }
    if (!idleLoop.isActive.value) idleLoop.resume();
  }

  useIntersectionObserver(rootRef, ([entry]) => {
    visible.value = Boolean(entry?.isIntersecting);
    if (visible.value) wake();
  });

  // ---- reveal timeline (replaces gsap tweens) --------------------------------
  let timeline: MaskedHeadingTimeline | null = null;

  const revealLoop = useRafFn(
    () => {
      const t = timeline;
      if (!t) {
        revealLoop.pause();
        return;
      }
      const elapsed = performance.now() - t.start;
      t.step(Math.min(elapsed, t.total));
      if (elapsed >= t.total) {
        timeline = null;
        revealLoop.pause();
      }
    },
    { immediate: false },
  );

  function startTimeline(t: MaskedHeadingTimeline) {
    timeline = t;
    t.start = performance.now();
    t.step(0);
    revealLoop.resume();
  }

  function killTimeline() {
    timeline = null;
    revealLoop.pause();
  }

  function setLayer(opacity: number, scale: number) {
    const layer = revealRef.value;
    if (!layer) return;
    layer.style.opacity = String(opacity);
    layer.style.transform = scale === 1 ? '' : `scale(${scale})`;
  }

  function clearLayer() {
    const layer = revealRef.value;
    if (!layer) return;
    setLayer(1, 1);
    layer.style.clipPath = '';
    layer.style.filter = '';
  }

  function em() {
    const root = rootRef.value;
    return root ? Number.parseFloat(getComputedStyle(root).fontSize) || 48 : 48;
  }

  function settle() {
    for (const st of states) {
      st.x = 0;
      st.y = 0;
      st.s = 1;
    }
    renderGlyphs();
    clearLayer();
  }

  function rest() {
    const layer = revealRef.value;
    if (!layer) return;
    const size = em();
    if (props.reveal === 'rise') {
      for (const st of states) st.y = size * 1.15;
    } else if (props.reveal === 'scale') {
      for (const st of states) {
        st.y = size * 0.1;
        st.s = 0;
      }
    } else if (props.reveal === 'blur') {
      for (const st of states) st.x = 0.22;
      setLayer(0, 1);
      layer.style.filter = `blur(${(size * 0.3).toFixed(2)}px)`;
    } else if (props.reveal === 'wipe') {
      layer.style.clipPath = 'inset(0% 100% 0% 0%)';
    } else if (props.reveal === 'fade') {
      setLayer(0, 1.08);
    }
    renderGlyphs();
  }

  function play() {
    const layer = revealRef.value;
    if (!layer || !states.length) return;
    killTimeline();
    const size = em();
    const dur = props.duration * 1000;
    const stg = props.stagger * 1000;
    const list = glyphs.value;

    if (props.reveal === 'rise') {
      clearLayer();
      const last = list.at(-1)?.w ?? 0;
      startTimeline({
        start: 0,
        total: last * stg + dur,
        step: (elapsed) => {
          states.forEach((st, i) => {
            const p = progressAt(elapsed, (list[i]?.w ?? 0) * stg, dur);
            st.x = 0;
            st.s = 1;
            st.y = size * 1.15 * (1 - easeOut4(p));
          });
          renderGlyphs();
        },
      });
    } else if (props.reveal === 'scale') {
      clearLayer();
      const step = stg * 0.35;
      startTimeline({
        start: 0,
        total: (states.length - 1) * step + dur,
        step: (elapsed) => {
          states.forEach((st, i) => {
            const e = easeExpoOut(progressAt(elapsed, i * step, dur));
            st.x = 0;
            st.y = size * 0.1 * (1 - e);
            st.s = e;
          });
          renderGlyphs();
        },
      });
    } else if (props.reveal === 'blur') {
      layer.style.clipPath = '';
      const total = dur * 1.2;
      startTimeline({
        start: 0,
        total,
        step: (elapsed) => {
          const p = progressAt(elapsed, 0, total);
          const x = 0.22 * (1 - easeExpoOut(p));
          for (const st of states) {
            st.x = x;
            st.y = 0;
            st.s = 1;
          }
          const focus = easeOut2(p);
          const blur = size * 0.3 * (1 - focus);
          layer.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
          setLayer(Number(focus.toFixed(3)), 1);
          renderGlyphs();
        },
      });
    } else if (props.reveal === 'wipe') {
      settle();
      startTimeline({
        start: 0,
        total: dur,
        step: (elapsed) => {
          const p = 100 * (1 - easeInOut3(progressAt(elapsed, 0, dur)));
          layer.style.clipPath = `inset(0% ${p}% 0% 0%)`;
        },
      });
    } else {
      settle();
      startTimeline({
        start: 0,
        total: dur,
        step: (elapsed) => {
          const e = easeOut3(progressAt(elapsed, 0, dur));
          setLayer(e, 1.08 - 0.08 * e);
        },
      });
    }
  }

  const revealActive = computed(() => props.reveal !== 'none' && !still.value);

  // ---- pointer -----------------------------------------------------------------
  function onMove(e: PointerEvent) {
    const root = rootRef.value;
    if (!root) return;
    const r = root.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
    const ny = ((e.clientY - r.top) / (r.height || 1)) * 2 - 1;
    off.tx = clamp(nx, -1, 1) * -Math.max(0, props.parallax);
    off.ty = clamp(ny, -1, 1) * -Math.max(0, props.parallax);
    off.px = ((e.clientX - r.left) / (r.width || 1)) * root.clientWidth;
    off.py = ((e.clientY - r.top) / (r.height || 1)) * root.clientHeight;
    if (props.spotlight) wake();
  }

  useEventListener(rootRef, 'pointermove', onMove);
  useEventListener(rootRef, 'pointerenter', (e: PointerEvent) => {
    hovering = e.pointerType !== 'touch';
    onMove(e);
    wake();
    if (props.trigger === 'hover' && revealActive.value) play();
  });
  useEventListener(rootRef, 'pointerleave', () => {
    hovering = false;
    off.tx = 0;
    off.ty = 0;
    wake();
  });

  useResizeObserver(rootRef, () => sync());

  function pauseVideoIfStill() {
    const video = mediaRef.value?.querySelector('video');
    if (video && still.value) video.pause();
  }

  let viewObserver: IntersectionObserver | null = null;

  function setupReveal() {
    viewObserver?.disconnect();
    viewObserver = null;
    killTimeline();
    states = glyphs.value.map(() => ({ x: 0, y: 0, s: 1 }));
    if (!states.length) return;
    if (!revealActive.value || props.trigger === 'hover') {
      settle();
      return;
    }
    if (props.trigger === 'view') {
      settle();
      rest();
      const root = rootRef.value;
      if (!root) return;
      viewObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            viewObserver?.disconnect();
            viewObserver = null;
          }
        },
        { threshold: 0.25 },
      );
      viewObserver.observe(root);
      return;
    }
    play();
  }

  onMounted(() => {
    sync();
    document.fonts?.ready.then(() => sync()).catch(() => {});
    setupReveal();
    pauseVideoIfStill();
    wake();

    watch(
      [
        words,
        () => props.tag,
        () => props.align,
        () => props.weight,
        () => props.tracking,
        () => props.lineHeight,
        () => props.textScale,
        () => props.outline,
      ],
      () => sync(),
      { flush: 'post' },
    );
    watch(
      [
        () => props.reveal,
        () => props.trigger,
        () => props.duration,
        () => props.stagger,
        glyphs,
        still,
      ],
      () => setupReveal(),
      { flush: 'post' },
    );
    watch([() => props.mediaType, () => props.src, still], pauseVideoIfStill, {
      flush: 'post',
    });
    // Upstream re-wakes the frame loop on every render.
    watch(
      [
        () => props.fillScale,
        () => props.drift,
        () => props.hoverZoom,
        () => props.brightness,
        () => props.saturation,
        () => props.grayscale,
        () => props.spotlight,
        () => props.parallax,
        still,
      ],
      () => wake(),
      { flush: 'post' },
    );
  });

  onBeforeUnmount(() => {
    viewObserver?.disconnect();
    viewObserver = null;
    killTimeline();
  });
</script>

<template>
  <component
    :is="props.tag"
    ref="root"
    :class="['masked-heading', props.class]"
    :style="rootStyle"
  >
    <span ref="measure" class="masked-heading__measure">
      <span
        v-for="(word, i) in words"
        :key="`${word}-${i}`"
        :ref="(el) => setWord(el, i)"
        class="masked-heading__word"
      >
        <span v-text="word" />
        <i :ref="(el) => setBase(el, i)" class="masked-heading__baseline" />
      </span>
    </span>

    <svg class="masked-heading__defs" aria-hidden="true" focusable="false">
      <defs>
        <clipPath :id="clipId" clipPathUnits="userSpaceOnUse">
          <text
            v-for="(glyph, i) in glyphs"
            :key="i"
            :ref="(el) => setGlyph(el, i)"
            v-text="glyph.char"
          />
        </clipPath>
      </defs>
    </svg>

    <span ref="reveal" class="masked-heading__reveal" aria-hidden="true">
      <span ref="clip" class="masked-heading__clip" :style="clipStyle">
        <span ref="media" class="masked-heading__media">
          <video
            v-if="props.mediaType === 'video'"
            class="masked-heading__source"
            :src="props.src || undefined"
            :poster="props.poster || undefined"
            autoplay
            muted
            loop
            playsinline
          />
          <img
            v-else
            class="masked-heading__source"
            :src="props.src || undefined"
            alt=""
            draggable="false"
          />
        </span>
        <span
          v-if="props.tint"
          class="masked-heading__tint"
          :style="{ background: props.tint }"
        />
        <template v-if="props.spotlight">
          <span
            class="masked-heading__spot masked-heading__spot--tone"
            :style="spotStyle"
          />
          <span
            class="masked-heading__spot masked-heading__spot--shade"
            :style="spotStyle"
          />
        </template>
      </span>
    </span>

    <svg
      v-if="props.outline"
      class="masked-heading__outline"
      aria-hidden="true"
      focusable="false"
      :style="outlineStyle"
    >
      <text
        v-for="(glyph, i) in glyphs"
        :key="i"
        :ref="(el) => setLine(el, i)"
        v-text="glyph.char"
      />
    </svg>
  </component>
</template>

<style scoped>
  .masked-heading {
    position: relative;
    width: 100%;
    margin: 0;
    padding: 0;
    text-wrap: balance;
    -webkit-font-smoothing: antialiased;
  }

  .masked-heading__measure {
    color: transparent;
  }

  .masked-heading__word {
    display: inline-block;
    white-space: pre;
  }

  .masked-heading__word:not(:last-child)::after {
    content: ' ';
  }

  .masked-heading__baseline {
    display: inline-block;
    width: 0;
    height: 0;
  }

  .masked-heading__defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  .masked-heading__reveal {
    position: absolute;
    inset: 0;
    display: block;
    pointer-events: none;
  }

  .masked-heading__clip {
    position: absolute;
    inset: 0;
    display: block;
  }

  .masked-heading__media {
    position: absolute;
    inset: 0;
    display: block;
    background: color-mix(in srgb, currentColor 10%, transparent);
    will-change: transform, filter;
  }

  .masked-heading__tint {
    position: absolute;
    inset: 0;
    display: block;
    mix-blend-mode: color;
    pointer-events: none;
  }

  .masked-heading__spot {
    position: absolute;
    inset: 0;
    display: block;
    pointer-events: none;
  }

  .masked-heading__spot--tone {
    background: #808080;
    mix-blend-mode: saturation;
  }

  .masked-heading__spot--shade {
    background: #000;
    opacity: 0.55;
  }

  .masked-heading__outline {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    fill: none;
    stroke-linejoin: round;
  }

  .masked-heading__source {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
  }
</style>
