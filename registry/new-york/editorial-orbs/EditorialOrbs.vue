<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useRafFn, useResizeObserver, useEventListener } from '@vueuse/core';
  import type {
    EditorialOrbsProps,
    EditorialOrb as Orb,
    EditorialOrbsTextSpan as TextSpan,
    EditorialOrbsPullQuote as PullQuote,
  } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<EditorialOrbsProps>(), {
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?" So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy and stupid, whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.`,
    orbCount: 5,
    showDropCap: true,
    showPullQuotes: true,
    className: undefined,
  });

  /* ── DOM refs ─────────────────────────────────── */
  const containerRef = ref<HTMLElement | null>(null);
  const canvasCtx = ref<CanvasRenderingContext2D | null>(null);

  /* ── State ────────────────────────────────────── */
  const containerW = ref(800);
  const containerH = ref(600);
  const columnCount = ref(3);
  const orbs = ref<Orb[]>([]);
  const textSpans = ref<TextSpan[]>([]);
  const prevProjection = ref<string>('');
  const dragIndex = ref(-1);
  const dragOffsetX = ref(0);
  const dragOffsetY = ref(0);

  /* ── Orb palette ──────────────────────────────── */
  const ORB_DEFS = [
    { r: 110, color: '#c4a35a', glow: '0 0 60px 20px rgba(196,163,90,0.35)' },
    { r: 85, color: '#4a6a9a', glow: '0 0 50px 16px rgba(74,106,154,0.30)' },
    { r: 95, color: '#9a4a6a', glow: '0 0 55px 18px rgba(154,74,106,0.30)' },
    { r: 75, color: '#4a9a6a', glow: '0 0 45px 14px rgba(74,154,106,0.28)' },
    { r: 65, color: '#6a4a9a', glow: '0 0 40px 12px rgba(106,74,154,0.28)' },
  ];

  /* ── Typography constants ─────────────────────── */
  const FONT_SIZE = 15;
  const LINE_HEIGHT = 22;
  const COL_GAP = 24;
  const PAD = 20;
  const DROP_CAP_LINES = 3;
  const FONT_FAMILY = 'Georgia, "Times New Roman", serif';

  /* ── Pull quotes ──────────────────────────────── */
  const PULL_QUOTE_TEXT = '"Oh dear! Oh dear! I shall be late!"';

  const pullQuotes = computed<PullQuote[]>(() => {
    if (!props.showPullQuotes) return [];
    const colW = colWidth.value;
    if (colW < 120) return [];
    return [
      {
        x: PAD + colW * 0.1,
        y: 120,
        w: colW * 0.8,
        h: 70,
        text: PULL_QUOTE_TEXT,
      },
    ];
  });

  const colWidth = computed(() => {
    const usable =
      containerW.value - PAD * 2 - COL_GAP * (columnCount.value - 1);
    return usable / columnCount.value;
  });

  const narrowMode = computed(() => containerW.value < 640);
  const orbScale = computed(() => (narrowMode.value ? 0.58 : 1));

  /* ── Canvas for text measurement ──────────────── */
  function ensureMeasureCtx(): CanvasRenderingContext2D {
    if (!canvasCtx.value) {
      const c = document.createElement('canvas');
      canvasCtx.value = c.getContext('2d')!;
    }
    return canvasCtx.value;
  }

  function measureWord(word: string, fontSize: number): number {
    const ctx = ensureMeasureCtx();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    return ctx.measureText(word).width;
  }

  /* ── Circle interval for band ─────────────────── */
  function circleIntervalForBand(
    cx: number,
    cy: number,
    r: number,
    bandTop: number,
    bandBottom: number,
    hPad: number,
    vPad: number,
  ): [number, number] | null {
    const bandMid = (bandTop + bandBottom) / 2;
    const dy = bandMid - cy;
    const effectiveR = r + vPad;
    if (Math.abs(dy) >= effectiveR) return null;
    const halfWidth = Math.sqrt(effectiveR * effectiveR - dy * dy) + hPad;
    return [cx - halfWidth, cx + halfWidth];
  }

  /* ── Rect interval for band ───────────────────── */
  function rectIntervalForBand(
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    bandTop: number,
    bandBottom: number,
    hPad: number,
    vPad: number,
  ): [number, number] | null {
    if (bandBottom < ry - vPad || bandTop > ry + rh + vPad) return null;
    return [rx - hPad, rx + rw + hPad];
  }

  /* ── Compute available slots in a line band ──── */
  function computeSlots(
    bandTop: number,
    bandBottom: number,
    colLeft: number,
    colRight: number,
    activeOrbs: Orb[],
    pqs: PullQuote[],
  ): Array<[number, number]> {
    const blocked: Array<[number, number]> = [];
    const scale = orbScale.value;

    for (const orb of activeOrbs) {
      const interval = circleIntervalForBand(
        orb.x,
        orb.y,
        orb.r * scale,
        bandTop,
        bandBottom,
        8,
        4,
      );
      if (interval) blocked.push(interval);
    }

    for (const pq of pqs) {
      const interval = rectIntervalForBand(
        pq.x,
        pq.y,
        pq.w,
        pq.h,
        bandTop,
        bandBottom,
        6,
        2,
      );
      if (interval) blocked.push(interval);
    }

    // Sort blocked intervals by start
    blocked.sort((a, b) => a[0] - b[0]);

    // Merge overlapping
    const merged: Array<[number, number]> = [];
    for (const b of blocked) {
      if (merged.length > 0 && b[0] <= merged[merged.length - 1]![1]) {
        merged[merged.length - 1]![1] = Math.max(
          merged[merged.length - 1]![1],
          b[1],
        );
      } else {
        merged.push([b[0], b[1]]);
      }
    }

    // Compute free slots
    const slots: Array<[number, number]> = [];
    let cursor = colLeft;
    for (const [bStart, bEnd] of merged) {
      if (bStart > cursor) {
        slots.push([cursor, bStart]);
      }
      cursor = Math.max(cursor, bEnd);
    }
    if (cursor < colRight) {
      slots.push([cursor, colRight]);
    }

    return slots;
  }

  /* ── Text projection equality ─────────────────── */
  function textProjectionEqual(spans: TextSpan[]): boolean {
    const key = spans
      .map((s) => `${s.word}:${Math.round(s.x)}:${Math.round(s.y)}`)
      .join('|');
    if (key === prevProjection.value) return true;
    prevProjection.value = key;
    return false;
  }

  /* ── Layout text ──────────────────────────────── */
  function layoutText(): TextSpan[] {
    const words = props.text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return [];

    const result: TextSpan[] = [];
    let wordIdx = 0;
    const activeOrbs = orbs.value.filter((o) => o.active);
    const pqs = pullQuotes.value;
    const cols = columnCount.value;
    const cw = colWidth.value;
    const SPACE_WIDTH = measureWord(' ', FONT_SIZE);

    for (let col = 0; col < cols && wordIdx < words.length; col++) {
      const colLeft = PAD + col * (cw + COL_GAP);
      const colRight = colLeft + cw;
      let y = PAD;

      // Drop cap for first column
      let dropCapRight = 0;
      let dropCapBottom = 0;
      if (col === 0 && props.showDropCap && wordIdx === 0 && words[0]) {
        const firstWord = words[0]!;
        const firstChar = firstWord[0]!;
        const dropFontSize = FONT_SIZE * DROP_CAP_LINES * 1.1;
        const dropWidth = measureWord(firstChar, dropFontSize) + 6;
        dropCapRight = colLeft + dropWidth;
        dropCapBottom = y + LINE_HEIGHT * DROP_CAP_LINES;

        result.push({
          word: firstChar,
          x: colLeft,
          y: y + LINE_HEIGHT * DROP_CAP_LINES * 0.82,
          width: dropWidth,
          isDropCap: true,
        });

        // Rest of first word
        const rest = firstWord.slice(1);
        if (rest.length > 0) {
          const restW = measureWord(rest, FONT_SIZE);
          result.push({
            word: rest,
            x: dropCapRight + 2,
            y: y + LINE_HEIGHT * 0.85,
            width: restW,
            isDropCap: false,
          });
        }
        wordIdx = 1;
      }

      const maxY = containerH.value - PAD;

      while (y < maxY && wordIdx < words.length) {
        const bandTop = y;
        const bandBottom = y + LINE_HEIGHT;

        // Adjust slots for drop cap area
        let effectiveColLeft = colLeft;
        if (
          col === 0 &&
          bandBottom <= dropCapBottom &&
          dropCapRight > colLeft
        ) {
          effectiveColLeft = dropCapRight + 2;
        }

        const slots = computeSlots(
          bandTop,
          bandBottom,
          effectiveColLeft,
          colRight,
          activeOrbs,
          pqs,
        );

        let placedAny = false;
        for (const [slotStart, slotEnd] of slots) {
          let x = slotStart;
          const slotWidth = slotEnd - slotStart;
          if (slotWidth < 20) continue;

          while (wordIdx < words.length) {
            const word = words[wordIdx]!;
            const ww = measureWord(word, FONT_SIZE);
            if (x + ww > slotEnd && x > slotStart) break;
            if (ww > slotWidth && x === slotStart) {
              // Word too wide for slot, skip it to next slot
              break;
            }
            result.push({
              word,
              x,
              y: bandTop + LINE_HEIGHT * 0.85,
              width: ww,
              isDropCap: false,
            });
            x += ww + SPACE_WIDTH;
            wordIdx++;
            placedAny = true;
          }
        }

        y += LINE_HEIGHT;
        if (!placedAny && slots.length === 0) continue;
      }
    }

    return result;
  }

  /* ── Physics ──────────────────────────────────── */
  function initOrbs() {
    const count = Math.min(props.orbCount, ORB_DEFS.length);
    const active = narrowMode.value ? Math.min(count, 3) : count;
    const arr: Orb[] = [];
    for (let i = 0; i < count; i++) {
      const def = ORB_DEFS[i]!;
      const scale = orbScale.value;
      const r = def.r * scale;
      arr.push({
        x: PAD + r + Math.random() * (containerW.value - PAD * 2 - r * 2),
        y: PAD + r + Math.random() * (containerH.value - PAD * 2 - r * 2),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        r: def.r,
        color: def.color,
        glow: def.glow,
        active: i < active,
      });
    }
    orbs.value = arr;
  }

  function updatePhysics() {
    const scale = orbScale.value;
    const w = containerW.value;
    const h = containerH.value;

    for (const orb of orbs.value) {
      if (!orb.active) continue;
      if (dragIndex.value >= 0 && orbs.value[dragIndex.value] === orb) continue;

      orb.x += orb.vx;
      orb.y += orb.vy;

      // Damping
      orb.vx *= 0.999;
      orb.vy *= 0.999;

      const r = orb.r * scale;
      // Wall bounce
      if (orb.x - r < 0) {
        orb.x = r;
        orb.vx = Math.abs(orb.vx) * 0.8;
      }
      if (orb.x + r > w) {
        orb.x = w - r;
        orb.vx = -Math.abs(orb.vx) * 0.8;
      }
      if (orb.y - r < 0) {
        orb.y = r;
        orb.vy = Math.abs(orb.vy) * 0.8;
      }
      if (orb.y + r > h) {
        orb.y = h - r;
        orb.vy = -Math.abs(orb.vy) * 0.8;
      }
    }

    // Orb-orb collision
    const activeOrbs = orbs.value.filter((o) => o.active);
    for (let i = 0; i < activeOrbs.length; i++) {
      for (let j = i + 1; j < activeOrbs.length; j++) {
        const a = activeOrbs[i]!;
        const b = activeOrbs[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.r + b.r) * scale;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          // Elastic collision
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dot = dvx * nx + dvy * ny;
          a.vx -= dot * nx * 0.8;
          a.vy -= dot * ny * 0.8;
          b.vx += dot * nx * 0.8;
          b.vy += dot * ny * 0.8;
        }
      }
    }
  }

  /* ── Animation loop ───────────────────────────── */
  const { pause: stopRaf, resume: startRaf } = useRafFn(
    () => {
      updatePhysics();
      const spans = layoutText();
      if (!textProjectionEqual(spans)) {
        textSpans.value = spans;
      }
    },
    { immediate: false },
  );

  /* ── Resize handling ──────────────────────────── */
  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width, height } = entry.contentRect;
    containerW.value = width;
    containerH.value = height;

    if (width > 1000) columnCount.value = 3;
    else if (width > 640) columnCount.value = 2;
    else columnCount.value = 1;

    // Reinit orbs for new size
    initOrbs();
  });

  /* ── Pointer drag ─────────────────────────────── */
  function findOrbAt(x: number, y: number): number {
    const scale = orbScale.value;
    for (let i = orbs.value.length - 1; i >= 0; i--) {
      const orb = orbs.value[i]!;
      if (!orb.active) continue;
      const dx = x - orb.x;
      const dy = y - orb.y;
      if (dx * dx + dy * dy <= orb.r * scale * (orb.r * scale)) return i;
    }
    return -1;
  }

  function getPointerPos(e: PointerEvent): { x: number; y: number } {
    const rect = containerRef.value?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  useEventListener(containerRef, 'pointerdown', (e: PointerEvent) => {
    const { x, y } = getPointerPos(e);
    const idx = findOrbAt(x, y);
    if (idx >= 0) {
      dragIndex.value = idx;
      const orb = orbs.value[idx]!;
      dragOffsetX.value = x - orb.x;
      dragOffsetY.value = y - orb.y;
      orb.vx = 0;
      orb.vy = 0;
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    }
  });

  useEventListener(containerRef, 'pointermove', (e: PointerEvent) => {
    if (dragIndex.value < 0) return;
    const { x, y } = getPointerPos(e);
    const orb = orbs.value[dragIndex.value]!;
    const prevX = orb.x;
    const prevY = orb.y;
    orb.x = x - dragOffsetX.value;
    orb.y = y - dragOffsetY.value;
    orb.vx = (orb.x - prevX) * 0.3;
    orb.vy = (orb.y - prevY) * 0.3;
  });

  useEventListener(containerRef, 'pointerup', () => {
    dragIndex.value = -1;
  });

  /* ── Lifecycle ────────────────────────────────── */
  onMounted(() => {
    if (containerRef.value) {
      containerW.value = containerRef.value.offsetWidth;
      containerH.value = containerRef.value.offsetHeight;
      if (containerW.value > 1000) columnCount.value = 3;
      else if (containerW.value > 640) columnCount.value = 2;
      else columnCount.value = 1;
    }
    initOrbs();
    textSpans.value = layoutText();
    startRaf();
  });

  onBeforeUnmount(() => {
    stopRaf();
    canvasCtx.value = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative select-none overflow-hidden',
        'bg-[linear-gradient(180deg,#0f0f14_0%,#0a0a0c_100%)]',
        className,
      )
    "
    style="touch-action: none; cursor: default"
  >
    <!-- Orbs -->
    <div
      v-for="(orb, i) in orbs"
      v-show="orb.active"
      :key="i"
      class="pointer-events-none absolute rounded-full"
      :style="{
        width: `${orb.r * 2 * orbScale}px`,
        height: `${orb.r * 2 * orbScale}px`,
        transform: `translate(${orb.x - orb.r * orbScale}px, ${orb.y - orb.r * orbScale}px)`,
        background: `radial-gradient(circle at 38% 35%, ${orb.color}cc, ${orb.color}66 50%, transparent 72%)`,
        boxShadow: orb.glow,
        willChange: 'transform',
      }"
    />

    <!-- Pull quotes -->
    <div
      v-for="(pq, i) in pullQuotes"
      :key="`pq-${i}`"
      class="pointer-events-none absolute flex items-center"
      :style="{
        left: `${pq.x}px`,
        top: `${pq.y}px`,
        width: `${pq.w}px`,
        height: `${pq.h}px`,
        borderLeft: '3px solid #6b5a3d',
        paddingLeft: '12px',
      }"
    >
      <span
        class="text-sm/snug italic"
        style="color: #c4a35a; font-family: Georgia, 'Times New Roman', serif"
      >
        {{ pq.text }}
      </span>
    </div>

    <!-- Text spans -->
    <span
      v-for="(span, i) in textSpans"
      :key="i"
      class="pointer-events-none absolute whitespace-nowrap"
      :style="{
        left: `${span.x}px`,
        top: `${span.y}px`,
        fontSize: span.isDropCap
          ? `${FONT_SIZE * DROP_CAP_LINES * 1.1}px`
          : `${FONT_SIZE}px`,
        lineHeight: span.isDropCap ? '1' : `${LINE_HEIGHT}px`,
        fontFamily: FONT_FAMILY,
        color: span.isDropCap ? '#c4a35a' : '#e8e4dc',
        fontWeight: span.isDropCap ? '700' : '400',
      }"
      >{{ span.word }}</span
    >
  </div>
</template>
