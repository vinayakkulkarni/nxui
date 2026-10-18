<script setup lang="ts">
  import {
    computed,
    onMounted,
    ref,
    shallowRef,
    useId,
    watch,
    watchEffect,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { animate } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    CELL,
    CELL_OFFSETS,
    CELL_STYLE,
    CHAR_HIDDEN_STYLE,
    CHAR_STYLE,
    COLUMN_HIDDEN_STYLE,
    COLUMN_STYLE,
    EASINGS,
    SLOT_STYLE,
    STAGGER,
    STRIP_STYLE,
    buildRoll,
    clamp01,
    formatCount,
    getDecimalPlaces,
    isCharSlot,
    makeSpring,
    mod10,
    smooth,
  } from './count-up-utils';
  import type {
    CountUpEmits,
    CountUpFormatOptions,
    CountUpLiveColumn,
    CountUpMark,
    CountUpPlay,
    CountUpProps,
    CountUpSlot,
  } from './types';

  const props = withDefaults(defineProps<CountUpProps>(), {
    from: 0,
    direction: 'up',
    delay: 0,
    duration: 2,
    startWhen: true,
    separator: '',
    prefix: '',
    suffix: '',
    mode: 'count',
    easing: 'easeOut',
    decimals: undefined,
    format: 'standard',
    trigger: 'view',
    replayOnHover: false,
    class: '',
  });

  const emit = defineEmits<CountUpEmits>();

  const rootRef = ref<HTMLSpanElement | null>(null);
  const textRef = ref<HTMLSpanElement | null>(null);
  const uid = useId().replace(/[^\w-]/g, '');
  const reducedMotion = usePreferredReducedMotion();
  const mounted = ref(false);
  const inView = ref(false);
  const play = shallowRef<CountUpPlay | null>(null);

  const slotEls: (HTMLElement | null)[] = [];
  const filterEls: (SVGElement | null)[] = [];

  const startValue = computed(() =>
    props.direction === 'down' ? props.to : props.from,
  );
  const endValue = computed(() =>
    props.direction === 'down' ? props.from : props.to,
  );
  const formatOptions = computed<CountUpFormatOptions>(() => ({
    compact: props.format === 'compact',
    decimals: props.decimals,
    places:
      props.decimals ??
      Math.max(getDecimalPlaces(props.from), getDecimalPlaces(props.to)),
    separator: props.separator,
  }));
  const active = computed(
    () => mounted.value && (props.trigger === 'load' || inView.value),
  );

  let value = startValue.value;
  let started = false;
  let running = false;

  function formatValue(latest: number): string {
    return formatCount(latest, formatOptions.value, props.prefix, props.suffix);
  }

  const initialText = formatValue(startValue.value);

  const model = computed(() => {
    if (props.mode !== 'roll') return null;
    const a = play.value ? play.value.from : startValue.value;
    const b = play.value ? play.value.to : endValue.value;
    return buildRoll(a, b, play.value?.spin ?? false, formatOptions.value);
  });

  const finalText = computed(() =>
    formatValue(play.value ? play.value.to : endValue.value),
  );

  function slotRef(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      slotEls[index] = el instanceof HTMLElement ? el : null;
    };
  }

  function filterRef(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      filterEls[index] = el instanceof SVGElement ? el : null;
    };
  }

  function isHidden(slot: CountUpSlot): boolean {
    if (!isCharSlot(slot)) return slot.enter;
    if (slot.enter) return true;
    if (slot.follow === undefined) return false;
    return model.value?.columns[slot.follow]?.enter ?? false;
  }

  function slotStyle(slot: CountUpSlot) {
    const hidden = isHidden(slot);
    if (isCharSlot(slot)) return hidden ? CHAR_HIDDEN_STYLE : CHAR_STYLE;
    return hidden ? COLUMN_HIDDEN_STYLE : COLUMN_STYLE;
  }

  useIntersectionObserver(rootRef, (entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      inView.value = true;
      observer.disconnect();
    }
  });

  onMounted(() => {
    mounted.value = true;
  });

  watchEffect(
    () => {
      if (!started) value = startValue.value;
      const text = formatValue(value);
      if (props.mode === 'count' && !running && textRef.value)
        textRef.value.textContent = text;
    },
    { flush: 'post' },
  );

  watch(
    [active, () => props.startWhen, endValue],
    () => {
      if (!active.value || !props.startWhen) return;
      started = true;
      play.value = {
        id: (play.value?.id ?? 0) + 1,
        from: value,
        to: endValue.value,
        spin: false,
        wait: true,
      };
    },
    { immediate: true },
  );

  function createRollRender(
    current: CountUpPlay,
    total: number,
  ): ((t: number) => void) | null {
    const root = rootRef.value;
    const roll = model.value;
    if (!root || !roll) return null;
    const ease = EASINGS[props.easing];
    const progress = (t: number) => (total > 0 ? clamp01(t / total) : 1);
    const layout = roll.columns;
    const fontSize = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
    const cell = CELL * fontSize;
    const stagger =
      layout.length > 1
        ? Math.min(STAGGER, (total * 0.4) / (layout.length - 1))
        : 0;
    const span = Math.max(0.001, total - stagger * (layout.length - 1));
    const spring = props.easing === 'spring';
    const columns: CountUpLiveColumn[] = layout.map((column) => {
      const box = slotEls[column.slot] ?? null;
      const first = box?.firstElementChild;
      const strip = first instanceof HTMLElement ? first : null;
      return {
        ...column,
        box,
        strip,
        blur: filterEls[column.index] ?? null,
        cells: strip
          ? Array.from(strip.children, (node) => node.firstChild)
          : [],
        width: box ? box.scrollWidth : 0,
        ease: spring
          ? makeSpring(
              Math.min(
                0.12,
                Math.max(0.01, 0.35 / Math.max(1, Math.abs(column.delta))),
              ),
            )
          : ease,
        base: Math.floor(column.from),
        sigma: 0,
        presence: column.enter ? 0 : 1,
      };
    });
    const marks: CountUpMark[] = [];
    roll.slots.forEach((slot, index) => {
      const node = slotEls[index];
      if (!isCharSlot(slot) || !node) return;
      if (!slot.enter && !slot.leave && slot.follow === undefined) return;
      marks.push({ ...slot, node, width: node.scrollWidth });
    });

    const fade = (
      node: HTMLElement | null,
      width: number,
      presence: number,
      settled: boolean,
    ) => {
      if (!node) return;
      node.style.width = settled ? '' : `${(presence * width).toFixed(2)}px`;
      node.style.opacity = settled ? '' : presence.toFixed(3);
    };

    return (t: number) => {
      columns.forEach((column, index) => {
        if (!column.strip) return;
        const u = clamp01((t - index * stagger) / span);
        const pos = column.from + column.delta * column.ease(u);
        const base = Math.floor(pos);
        if (base !== column.base) {
          column.base = base;
          column.cells.forEach((node, offset) => {
            if (node) node.nodeValue = String(mod10(base + offset - 1));
          });
        }
        column.strip.style.transform = `translateY(${(-(1 + pos - base) * CELL).toFixed(4)}em)`;

        const u0 = Math.max(0, u - 0.004);
        const u1 = Math.min(1, u + 0.004);
        const speed =
          u1 > u0
            ? (Math.abs(column.delta) *
                Math.abs(column.ease(u1) - column.ease(u0))) /
              (u1 - u0) /
              span
            : 0;
        const sigma =
          u > 0 && u < 1 ? Math.min(cell * 0.05, (speed * cell) / 600) : 0;
        if (
          Math.abs(sigma - column.sigma) > 0.05 ||
          (sigma === 0 && column.sigma !== 0)
        ) {
          column.sigma = sigma;
          if (sigma > 0.2 && column.blur) {
            column.blur.setAttribute('stdDeviation', `0 ${sigma.toFixed(2)}`);
            column.strip.style.filter = `url(#${uid}-${index})`;
          } else {
            column.strip.style.filter = '';
          }
        }

        if (column.enter || column.leave) {
          column.presence = column.enter
            ? smooth(0, 0.45, u)
            : 1 - smooth(0.55, 1, u);
          fade(
            column.box,
            column.width,
            column.presence,
            column.enter && u >= 1,
          );
        }
      });

      const overall = progress(t);
      marks.forEach((mark) => {
        if (mark.follow !== undefined) {
          const column = columns[mark.follow];
          if (column && (column.enter || column.leave))
            fade(
              mark.node,
              mark.width,
              column.presence,
              column.enter && column.presence >= 1,
            );
        } else {
          const presence = mark.enter
            ? smooth(0, 0.3, overall)
            : 1 - smooth(0.7, 1, overall);
          fade(mark.node, mark.width, presence, !!mark.enter && overall >= 1);
        }
      });

      value = current.from + (current.to - current.from) * ease(overall);
    };
  }

  watch(
    play,
    (current, _previous, onCleanup) => {
      if (!current) return;
      const ease = EASINGS[props.easing];
      const total = Math.max(0, props.duration);
      const progress = (t: number) => (total > 0 ? clamp01(t / total) : 1);
      const render =
        (props.mode === 'roll' ? createRollRender(current, total) : null) ??
        ((t: number) => {
          const next =
            current.from + (current.to - current.from) * ease(progress(t));
          value = next;
          if (textRef.value) textRef.value.textContent = formatValue(next);
        });

      running = true;
      emit('start');

      const finish = () => {
        render(Number.POSITIVE_INFINITY);
        value = current.to;
        running = false;
        emit('end');
      };

      if (reducedMotion.value === 'reduce') {
        finish();
        return;
      }

      const controls = animate(0, total, {
        duration: total,
        delay: current.wait ? props.delay : 0,
        ease: 'linear',
        onUpdate: render,
        onComplete: finish,
      });

      onCleanup(() => {
        controls.stop();
        running = false;
      });
    },
    { flush: 'post' },
  );

  function onPointerEnter(): void {
    if (!props.replayOnHover || running || !started) return;
    const id = (play.value?.id ?? 0) + 1;
    play.value =
      props.mode === 'roll'
        ? { id, from: value, to: value, spin: true, wait: false }
        : {
            id,
            from: startValue.value,
            to: endValue.value,
            spin: false,
            wait: false,
          };
  }
</script>

<template>
  <span
    ref="rootRef"
    :class="cn('tabular-nums', props.class)"
    @pointerenter="onPointerEnter"
  >
    <template v-if="model">
      <span
        :key="`roll-${play?.id ?? 0}`"
        aria-hidden="true"
        class="inline-flex whitespace-pre select-none"
      >
        <span v-if="props.prefix" :style="SLOT_STYLE">{{ props.prefix }}</span>
        <template v-for="(slot, index) in model.slots" :key="index">
          <span
            v-if="isCharSlot(slot)"
            :ref="slotRef(index)"
            :style="slotStyle(slot)"
            >{{ slot.char }}</span
          >
          <span v-else :ref="slotRef(index)" :style="slotStyle(slot)">
            <span :style="STRIP_STYLE">
              <span
                v-for="offset in CELL_OFFSETS"
                :key="offset"
                :style="CELL_STYLE"
                >{{ mod10(slot.from + offset) }}</span
              >
            </span>
          </span>
        </template>
        <span v-if="model.label" :style="SLOT_STYLE">{{ model.label }}</span>
        <span v-if="props.suffix" :style="SLOT_STYLE">{{ props.suffix }}</span>
      </span>
      <span class="sr-only">{{ finalText }}</span>
      <svg aria-hidden="true" width="0" height="0" class="absolute">
        <defs>
          <filter
            v-for="column in model.columns"
            :id="`${uid}-${column.index}`"
            :key="column.index"
            x="-20%"
            y="-50%"
            width="140%"
            height="200%"
            color-interpolation-filters="sRGB"
          >
            <feGaussianBlur :ref="filterRef(column.index)" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>
    </template>
    <span v-else key="count" ref="textRef">{{ initialText }}</span>
  </span>
</template>
