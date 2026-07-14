<script setup lang="ts">
  import { ref, computed, watch, onMounted, useId } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    buildGeometry,
    bentRectPath,
    bentLinePath,
    round2,
    hexToRgba,
  } from './geometry';
  import type { CurvedInputProps, CurvedInputShadowSize } from './types';

  const SHADOWS: Record<CurvedInputShadowSize, [number, number, number]> = {
    sm: [5, 12, 0.3],
    md: [10, 24, 0.4],
    lg: [16, 40, 0.52],
  };

  const THEMES = {
    dark: {
      backgroundColor: '#1B1722',
      textColor: '#f5f5f5',
      placeholderColor: '#a1a1aa',
      borderColor: '#392e4e',
      buttonColor: '#A855F7',
      buttonTextColor: '#ffffff',
      shadowColor: '#000000',
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#1d2050',
      placeholderColor: '#9aa0b6',
      borderColor: '#262a56',
      buttonColor: '#4763eb',
      buttonTextColor: '#ffffff',
      shadowColor: '#0b0e2a',
    },
  } as const;

  const SELECTABLE_TYPES = ['text', 'search', 'tel', 'url', 'password'];

  const props = withDefaults(defineProps<CurvedInputProps>(), {
    placeholder: 'Enter your email',
    buttonText: 'Get Started',
    type: 'email',
    name: undefined,
    ariaLabel: undefined,
    theme: 'dark',
    width: 450,
    bend: 28,
    height: 64,
    cornerRadius: 18,
    borderWidth: 1.5,
    fontSize: 16,
    backgroundColor: undefined,
    textColor: undefined,
    placeholderColor: undefined,
    borderColor: undefined,
    buttonColor: undefined,
    buttonTextColor: undefined,
    iconColor: undefined,
    shadowSize: 'md',
    shadowColor: undefined,
    showButton: true,
    showIcon: true,
    class: '',
  });

  const emit = defineEmits<{
    submit: [value: string];
  }>();

  /** Input value. */
  const value = defineModel<string>({ default: '' });

  const uid = useId().replace(/[:-]/g, '');
  const layoutPathId = `ci-text-${uid}`;
  const buttonPathId = `ci-btn-${uid}`;
  const clipId = `ci-clip-${uid}`;

  const rootRef = ref<HTMLFormElement | null>(null);
  const svgRef = ref<SVGSVGElement | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);
  const textRef = ref<SVGTextElement | null>(null);
  const btnMeasureRef = ref<SVGTextElement | null>(null);

  const w = ref(0);
  const caretIndex = ref(value.value.length);
  const focused = ref(false);
  const caretU = ref(0);
  const scrollLen = ref(0);
  const btnTextW = ref(0);
  let scrollCur = 0;

  const display = computed(() =>
    props.type === 'password' ? '•'.repeat(value.value.length) : value.value,
  );

  const palette = computed(() => THEMES[props.theme] || THEMES.dark);
  const bgColor = computed(
    () => props.backgroundColor ?? palette.value.backgroundColor,
  );
  const fgColor = computed(() => props.textColor ?? palette.value.textColor);
  const phColor = computed(
    () => props.placeholderColor ?? palette.value.placeholderColor,
  );
  const strokeColor = computed(
    () => props.borderColor ?? palette.value.borderColor,
  );
  const accentColor = computed(
    () => props.buttonColor ?? palette.value.buttonColor,
  );
  const btnFgColor = computed(
    () => props.buttonTextColor ?? palette.value.buttonTextColor,
  );
  const shColor = computed(
    () => props.shadowColor ?? palette.value.shadowColor,
  );

  useResizeObserver(rootRef, (entries) => {
    const cw =
      entries[0]?.contentRect?.width ?? rootRef.value?.clientWidth ?? 0;
    w.value = Math.round(cw);
  });

  const pad = computed(() => Math.ceil(props.borderWidth / 2) + 6);

  const geom = computed(() =>
    w.value > 2
      ? buildGeometry(w.value, props.bend, props.height, pad.value)
      : null,
  );

  const layout = computed(() => {
    const g = geom.value;
    if (!g) return null;
    const T = props.height;
    const btnInset = Math.max(5, props.borderWidth + 4);
    const chipH = Math.min(34, Math.max(16, T * 0.34));
    const chipW = chipH * 1.25;
    const iconU = 22 + chipW / 2;
    const textStartU = props.showIcon ? 22 + chipW + 13 : 24;
    const btnW = props.showButton
      ? Math.max(btnTextW.value + props.fontSize * 2.7, T * 1.35)
      : 0;
    const btnU1 = g.W - btnInset;
    const btnU0 = btnU1 - btnW;
    const textEndU = Math.max(
      textStartU + 20,
      props.showButton ? btnU0 - 14 : g.W - 24,
    );
    const winLen = (textEndU - textStartU) / g.uPerLen;
    return {
      btnInset,
      chipH,
      chipW,
      iconU,
      textStartU,
      textEndU,
      btnU0,
      btnU1,
      winLen,
    };
  });

  // Measure rendered text to keep the caret on the curve and scroll long
  // values along the arc, exactly like a native input would.
  function measure(): void {
    if (btnMeasureRef.value) {
      const bw = btnMeasureRef.value.getComputedTextLength();
      if (Math.abs(btnTextW.value - bw) > 0.5) btnTextW.value = bw;
    }
    const g = geom.value;
    const l = layout.value;
    if (!g || !l) return;
    const textEl = textRef.value;
    const caret = Math.min(caretIndex.value, display.value.length);
    let caretLen = 0;
    let totalLen = 0;
    if (textEl && display.value.length) {
      try {
        totalLen = textEl.getSubStringLength(0, display.value.length);
        caretLen = caret > 0 ? textEl.getSubStringLength(0, caret) : 0;
      } catch {
        totalLen = 0;
        caretLen = 0;
      }
    }
    let next = scrollCur;
    if (caretLen - next > l.winLen - 2) next = caretLen - l.winLen + 2;
    if (caretLen - next < 0) next = caretLen;
    if (totalLen - next < l.winLen) next = Math.max(0, totalLen - l.winLen);
    next = Math.max(0, next);
    if (Math.abs(next - scrollCur) > 0.5) {
      scrollCur = next;
      scrollLen.value = next;
    }
    caretU.value = l.textStartU + (caretLen - next) * g.uPerLen;
  }

  onMounted(() => {
    requestAnimationFrame(measure);
    // Re-measure once webfonts finish loading
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(measure));
    }
  });

  watch([display, caretIndex, geom, layout, focused], () => {
    requestAnimationFrame(measure);
  });

  function handleInputChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    value.value = target.value;
    caretIndex.value = target.selectionStart ?? target.value.length;
  }

  function handleSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    caretIndex.value = target.selectionStart ?? target.value.length;
  }

  function handleSubmit(e?: Event): void {
    e?.preventDefault?.();
    emit('submit', value.value);
  }

  // Click on the curve: focus the hidden input and drop the caret on the
  // character closest to the click, measured in arc length.
  function handleSurfaceClick(e: MouseEvent): void {
    const input = inputRef.value;
    if (!input) return;
    let idx = display.value.length;
    const svg = svgRef.value;
    const textEl = textRef.value;
    const g = geom.value;
    const l = layout.value;
    if (svg && g && l && textEl && display.value.length) {
      try {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
            ctm.inverse(),
          );
          const target =
            scrollCur + (g.uFromPoint(pt.x, pt.y) - l.textStartU) / g.uPerLen;
          let best = 0;
          let bestDist = Infinity;
          for (let i = 0; i <= display.value.length; i++) {
            const li = i === 0 ? 0 : textEl.getSubStringLength(0, i);
            const d = Math.abs(li - target);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          }
          idx = best;
        }
      } catch {
        idx = display.value.length;
      }
    }
    input.focus();
    try {
      input.setSelectionRange(idx, idx);
    } catch {
      /* selection API unavailable for this input type */
    }
    caretIndex.value = idx;
  }

  function handlePointerDown(e: PointerEvent): void {
    e.preventDefault();
  }

  function handleButtonClick(e: MouseEvent): void {
    e.stopPropagation();
    handleSubmit();
  }

  function stopPointer(e: PointerEvent): void {
    e.stopPropagation();
  }

  function handleButtonKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSubmit();
    }
  }

  const safeType = computed(() =>
    SELECTABLE_TYPES.includes(props.type) ? props.type : 'text',
  );
  const inputMode = computed(() =>
    props.type === 'email'
      ? 'email'
      : props.type === 'number'
        ? 'decimal'
        : undefined,
  );

  const svgStyle = computed(() => {
    const shadow = SHADOWS[props.shadowSize];
    return shadow
      ? {
          filter: `drop-shadow(0 ${shadow[0]}px ${shadow[1]}px ${hexToRgba(shColor.value, shadow[2])})`,
        }
      : undefined;
  });

  const vBase = computed(() => props.fontSize * 0.34);
  const scrollU = computed(() => scrollLen.value * (geom.value?.uPerLen ?? 1));

  const bandPath = computed(() => {
    const g = geom.value;
    if (!g) return '';
    return bentRectPath(
      g,
      0,
      g.W,
      -props.height / 2,
      props.height / 2,
      props.cornerRadius,
    );
  });

  const layoutPath = computed(() => {
    const g = geom.value;
    const l = layout.value;
    if (!g || !l) return '';
    return bentLinePath(g, l.textStartU - scrollU.value, g.W, vBase.value);
  });

  const clipPathD = computed(() => {
    const g = geom.value;
    const l = layout.value;
    if (!g || !l) return '';
    return bentRectPath(
      g,
      l.textStartU - 6,
      l.textEndU + 8,
      -props.height / 2,
      props.height / 2,
      0,
    );
  });

  const chip = computed(() => {
    const g = geom.value;
    const l = layout.value;
    if (!g || !l) return null;
    const { chipW, chipH } = l;
    const [ix, iy] = g.point(l.iconU, 0);
    return {
      fill: props.iconColor || accentColor.value,
      w: chipW,
      h: chipH,
      ew: chipW * 0.5,
      eh: chipH * 0.5,
      sw: Math.max(1.1, chipH * 0.075),
      x: round2(ix),
      y: round2(iy),
      angle: round2(g.angleAt(l.iconU)),
    };
  });

  const chipFlapPath = computed(() => {
    const c = chip.value;
    if (!c) return '';
    return `M ${round2(-c.ew / 2)} ${round2(-c.eh / 2 + c.sw * 0.4)} L 0 ${round2(c.eh * 0.14)} L ${round2(c.ew / 2)} ${round2(-c.eh / 2 + c.sw * 0.4)}`;
  });

  const caret = computed(() => {
    const g = geom.value;
    if (!g) return null;
    const [x, y] = g.point(caretU.value, 0);
    return {
      x: round2(x),
      y: round2(y),
      angle: round2(g.angleAt(caretU.value)),
      h: Math.min(props.height * 0.58, props.fontSize * 1.45),
    };
  });

  const buttonPath = computed(() => {
    const g = geom.value;
    const l = layout.value;
    if (!g || !l || !props.showButton) return '';
    const btnH = props.height - l.btnInset * 2;
    return bentRectPath(
      g,
      l.btnU0,
      l.btnU1,
      -props.height / 2 + l.btnInset,
      props.height / 2 - l.btnInset,
      Math.min(props.cornerRadius * 0.72, btnH / 2),
    );
  });

  const buttonTextPath = computed(() => {
    const g = geom.value;
    const l = layout.value;
    if (!g || !l || !props.showButton) return '';
    return bentLinePath(g, l.btnU0, l.btnU1, vBase.value);
  });

  const rootStyle = computed(() => ({
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  }));
</script>

<template>
  <form
    ref="rootRef"
    :class="cn('curved-input', focused && 'curved-input--focused', props.class)"
    :style="rootStyle"
    novalidate
    @submit="handleSubmit"
  >
    <svg
      v-if="geom && layout"
      ref="svgRef"
      class="curved-input__svg"
      :width="geom.W"
      :height="round2(geom.svgH)"
      :viewBox="`0 0 ${geom.W} ${round2(geom.svgH)}`"
      :style="svgStyle"
      @pointerdown="handlePointerDown"
      @click="handleSurfaceClick"
    >
      <defs>
        <clipPath :id="clipId">
          <path :d="clipPathD" />
        </clipPath>
      </defs>

      <path
        class="curved-input__ring"
        :d="bandPath"
        fill="none"
        :stroke="accentColor"
        :stroke-width="borderWidth + 6"
      />
      <path
        :d="bandPath"
        :fill="bgColor"
        :stroke="strokeColor"
        :stroke-width="borderWidth"
      />

      <path :id="layoutPathId" :d="layoutPath" fill="none" />

      <g
        v-if="showIcon && chip"
        :transform="`translate(${chip.x} ${chip.y}) rotate(${chip.angle})`"
        aria-hidden="true"
      >
        <rect
          :x="-chip.w / 2"
          :y="-chip.h / 2"
          :width="chip.w"
          :height="chip.h"
          :rx="chip.h * 0.27"
          :fill="chip.fill"
        />
        <rect
          :x="-chip.ew / 2"
          :y="-chip.eh / 2"
          :width="chip.ew"
          :height="chip.eh"
          :rx="1.4"
          fill="none"
          stroke="#ffffff"
          :stroke-width="chip.sw"
          stroke-linejoin="round"
        />
        <path
          :d="chipFlapPath"
          fill="none"
          stroke="#ffffff"
          :stroke-width="chip.sw"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </g>

      <g :clip-path="`url(#${clipId})`">
        <text
          ref="textRef"
          :style="{ fontSize: `${fontSize}px`, fontWeight: 500 }"
          :fill="fgColor"
          xml:space="preserve"
          aria-hidden="true"
        >
          <textPath :href="`#${layoutPathId}`">{{ display }}</textPath>
        </text>
        <text
          v-if="!display && placeholder"
          :style="{ fontSize: `${fontSize}px`, fontWeight: 500 }"
          :fill="phColor"
          xml:space="preserve"
          aria-hidden="true"
        >
          <textPath :href="`#${layoutPathId}`">{{ placeholder }}</textPath>
        </text>
        <g
          v-if="focused && caret"
          :key="`${display}-${Math.min(caretIndex, display.length)}`"
          :transform="`translate(${caret.x} ${caret.y}) rotate(${caret.angle})`"
        >
          <line
            :y1="-caret.h / 2"
            :y2="caret.h / 2"
            :stroke="fgColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1.06s"
              calcMode="discrete"
              repeatCount="indefinite"
            />
          </line>
        </g>
      </g>

      <g
        v-if="showButton"
        class="curved-input__button"
        role="button"
        tabindex="0"
        :aria-label="buttonText"
        @click="handleButtonClick"
        @pointerdown="stopPointer"
        @keydown="handleButtonKeydown"
      >
        <path
          class="curved-input__button-bg"
          :d="buttonPath"
          :fill="accentColor"
        />
        <path :id="buttonPathId" :d="buttonTextPath" fill="none" />
        <text
          :fill="btnFgColor"
          text-anchor="middle"
          :style="{
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            pointerEvents: 'none',
          }"
        >
          <textPath :href="`#${buttonPathId}`" startOffset="50%">
            {{ buttonText }}
          </textPath>
        </text>
      </g>

      <text
        ref="btnMeasureRef"
        :style="{ fontSize: `${fontSize}px`, fontWeight: 600 }"
        x="-9999"
        y="-9999"
        visibility="hidden"
        aria-hidden="true"
      >
        {{ buttonText }}
      </text>
    </svg>

    <input
      ref="inputRef"
      class="curved-input__field"
      :type="safeType"
      :inputmode="inputMode"
      :name="name"
      :value="value"
      :aria-label="ariaLabel || placeholder || 'Curved input'"
      autocomplete="off"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      @input="handleInputChange"
      @select="handleSelect"
      @keyup="handleSelect"
      @focus="focused = true"
      @blur="focused = false"
    />
  </form>
</template>

<style scoped>
  .curved-input {
    position: relative;
    display: block;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .curved-input__svg {
    display: block;
    overflow: visible;
    width: 100%;
    height: auto;
    cursor: text;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .curved-input__svg text {
    font-family: inherit;
  }

  .curved-input__ring {
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .curved-input--focused .curved-input__ring {
    opacity: 0.28;
  }

  .curved-input__button {
    cursor: pointer;
    outline: none;
  }

  .curved-input__button-bg {
    transition:
      filter 0.2s ease,
      opacity 0.2s ease;
  }

  .curved-input__button:hover .curved-input__button-bg {
    filter: brightness(1.12);
  }

  .curved-input__button:active .curved-input__button-bg {
    filter: brightness(0.94);
  }

  .curved-input__button:focus-visible .curved-input__button-bg {
    filter: brightness(1.18);
  }

  .curved-input__field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    font-size: 16px;
    pointer-events: none;
    outline: none;
  }
</style>
