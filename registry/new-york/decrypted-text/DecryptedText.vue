<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import { useIntervalFn, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    FADE_FLOOR,
    FADE_LEAD,
    FADE_PEAK,
    SETTLE,
    advance,
    flipFrames,
    forgetFont,
    isSpace,
    prefersReducedMotion,
    readFont,
  } from './decrypted-text-metrics';
  import type {
    DecryptedTextFontMetrics,
    DecryptedTextFrame,
    DecryptedTextGroup,
    DecryptedTextPoint,
    DecryptedTextProps,
    DecryptedTextRun,
    DecryptedTextRunOptions,
  } from './types';

  const props = withDefaults(defineProps<DecryptedTextProps>(), {
    speed: 50,
    maxIterations: 10,
    sequential: false,
    revealDirection: 'start',
    useOriginalCharsOnly: false,
    characters:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
    revealedClass: '',
    encryptedClass: '',
    animateOn: 'hover',
    clickMode: 'once',
    effect: 'scramble',
    scrambleColor: '',
    loop: false,
    loopDelay: 2000,
    hoverRadius: 0,
    class: '',
  });

  const chars = computed(() => Array.from(String(props.text ?? '')));

  const pool = computed(() => {
    const letters = chars.value.filter((char) => !isSpace(char));
    const source = props.useOriginalCharsOnly
      ? Array.from(new Set(letters))
      : Array.from(props.characters);
    return source.length ? source : letters;
  });

  const startsHidden = computed(
    () =>
      props.animateOn === 'click' ||
      props.animateOn === 'view' ||
      props.animateOn === 'inViewHover',
  );
  const hoverable = computed(
    () => props.animateOn === 'hover' || props.animateOn === 'inViewHover',
  );
  const local = computed(() => hoverable.value && props.hoverRadius > 0);
  const step = computed(() => Math.max(16, props.speed));

  function initialFrame(): DecryptedTextFrame {
    const list = pool.value;
    const revealed = chars.value.map(
      (char) => !startsHidden.value || isSpace(char),
    );
    return {
      shown: chars.value.map((char, index) =>
        revealed[index] || !list.length
          ? char
          : (list[((char.codePointAt(0) ?? 0) + index * 7) % list.length] ??
            char),
      ),
      revealed,
      tint: revealed.map((shown) => (shown ? 0 : 1)),
      dim: revealed.map((shown) => (shown ? 1 : FADE_FLOOR)),
      squeeze: revealed.map(() => 1),
    };
  }

  const frame = shallowRef<DecryptedTextFrame>(initialFrame());
  const root = ref<HTMLElement | null>(null);
  const cells: (HTMLElement | null)[] = [];
  let centers: (DecryptedTextPoint | null)[] = [];
  let mask: boolean[] = frame.value.revealed;
  let heat: number[] = [];
  let warmActive = false;
  let pointer: DecryptedTextPoint | null = null;
  let run: DecryptedTextRun | null = null;
  let hold: ReturnType<typeof setTimeout> | null = null;
  let pending: (() => void) | null = null;
  let visible = true;
  let target = !startsHidden.value;
  let played = false;
  let font: DecryptedTextFontMetrics | null = null;

  function setCell(index: number, node: unknown) {
    cells[index] = node instanceof HTMLElement ? node : null;
  }

  function revealOrder(): number[] {
    const order: number[] = [];
    chars.value.forEach((char, index) => {
      if (!isSpace(char)) order.push(index);
    });
    if (props.revealDirection === 'end') return order.reverse();
    if (props.revealDirection === 'center') {
      const middle = Math.floor(chars.value.length / 2);
      return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
    }
    if (props.revealDirection === 'random') {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = order[i] ?? 0;
        order[i] = order[j] ?? 0;
        order[j] = swap;
      }
    }
    return order;
  }

  function fit(index: number, glyph: string): number {
    if (!font && root.value) font = readFont(root.value);
    if (!font) return 1;
    const room = advance(font.font, chars.value[index] ?? glyph) + font.spacing;
    const need = advance(font.font, glyph) + font.spacing;
    return need > room + 0.01
      ? Math.round(Math.max(0.05, room / need) * 1000) / 1000
      : 1;
  }

  function paint() {
    const ranks =
      run?.forward && props.sequential
        ? new Map(run.queue.map((index, rank) => [index, rank]))
        : null;
    const ramp =
      run?.forward && !props.sequential
        ? Math.min(1, run.iteration / Math.max(1, props.maxIterations))
        : 0;
    const next: DecryptedTextFrame = {
      shown: [],
      revealed: [],
      tint: [],
      dim: [],
      squeeze: [],
    };
    const list = pool.value;

    chars.value.forEach((char, index) => {
      const blank = isSpace(char);
      const hot = blank ? 0 : (heat[index] ?? 0);
      const hidden = !blank && !mask[index];
      const scrambled = hidden || (hot > 0 && Math.random() < hot * 2);
      const glyph = scrambled
        ? (list[Math.floor(Math.random() * list.length)] ?? char)
        : char;
      next.revealed.push(!scrambled);
      next.shown.push(glyph);
      next.squeeze.push(scrambled ? fit(index, glyph) : 1);

      if (!scrambled) {
        next.tint.push(0);
        next.dim.push(1);
      } else if (!hidden) {
        const level = Math.min(1, hot * 1.5);
        next.tint.push(level);
        next.dim.push(1 - (1 - FADE_FLOOR) * level);
      } else {
        const rank = ranks?.get(index);
        const lift =
          rank === undefined ? ramp : Math.max(0, 1 - rank / FADE_LEAD);
        next.tint.push(1);
        next.dim.push(FADE_FLOOR + (FADE_PEAK - FADE_FLOOR) * lift);
      }
    });

    frame.value = next;
  }

  function refit() {
    const previous = frame.value;
    frame.value = {
      ...previous,
      squeeze: previous.shown.map((glyph, index) =>
        previous.revealed[index] ? 1 : fit(index, glyph),
      ),
    };
  }

  const ticker = useIntervalFn(tick, step, { immediate: false });

  function ensureTicker() {
    if (!ticker.isActive.value) ticker.resume();
  }

  function stopRun() {
    run = null;
    if (hold) clearTimeout(hold);
    hold = null;
    pending = null;
  }

  function schedule(task: () => void, delay: number) {
    if (hold) clearTimeout(hold);
    hold = setTimeout(() => {
      hold = null;
      if (visible) task();
      else pending = task;
    }, delay);
  }

  function startRun(forward: boolean, options: DecryptedTextRunOptions = {}) {
    const { from, cycle = false, lead = 0 } = options;
    stopRun();
    target = forward;
    if (from) mask = from;

    if (prefersReducedMotion()) {
      mask = chars.value.map((char) => forward || isSpace(char));
      paint();
      return;
    }

    const current = mask;
    const order = forward ? revealOrder() : revealOrder().reverse();
    const queue = props.sequential
      ? order.filter((index) => current[index] !== forward)
      : [];

    run = {
      forward,
      cycle,
      iteration: 0,
      queue: [...Array.from({ length: lead }, () => null), ...queue],
    };
    paint();
    ensureTicker();
  }

  function finishRun(done: DecryptedTextRun) {
    if (!props.loop) return;
    if (done.forward) {
      schedule(
        () => startRun(false, { cycle: true }),
        Math.max(0, props.loopDelay),
      );
    } else if (done.cycle) {
      startRun(true, {
        cycle: true,
        lead: props.sequential ? Math.max(2, Math.round(320 / step.value)) : 0,
      });
    }
  }

  function warm() {
    const box =
      pointer && root.value ? root.value.getBoundingClientRect() : null;
    const cool = 1 / Math.max(1, props.maxIterations);
    let active = false;

    chars.value.forEach((char, index) => {
      if (isSpace(char)) return;
      let goal = 0;
      const center = centers[index];
      if (box && center && pointer) {
        const distance =
          Math.hypot(
            box.left + center.x - pointer.x,
            box.top + center.y - pointer.y,
          ) / Math.max(1, props.hoverRadius);
        if (distance < 1) goal = 1 - distance * distance * (3 - 2 * distance);
      }
      const value = Math.max((heat[index] ?? 0) - cool, goal);
      const settled = value > 0.001 ? value : 0;
      heat[index] = settled;
      if (settled > 0) active = true;
    });

    warmActive = active;
  }

  function tick() {
    const current = run;
    if (current) {
      current.iteration += 1;
      let next = mask;
      let done: boolean;

      if (props.sequential) {
        const index = current.queue.shift();
        if (index !== undefined && index !== null) {
          next = next.slice();
          next[index] = current.forward;
        }
        done = current.queue.length === 0;
      } else if (current.forward) {
        done = current.iteration >= props.maxIterations;
        if (done) next = chars.value.map(() => true);
      } else {
        const shownIndexes: number[] = [];
        next.forEach((shown, index) => {
          if (shown && !isSpace(chars.value[index] ?? ' ')) {
            shownIndexes.push(index);
          }
        });
        const letterCount = chars.value.filter((char) => !isSpace(char)).length;
        const hideCount = Math.max(
          1,
          Math.ceil(letterCount / Math.max(1, props.maxIterations)),
        );
        next = next.slice();
        for (let i = 0; i < hideCount && shownIndexes.length; i++) {
          const [hide] = shownIndexes.splice(
            Math.floor(Math.random() * shownIndexes.length),
            1,
          );
          if (hide !== undefined) next[hide] = false;
        }
        done =
          shownIndexes.length === 0 || current.iteration >= props.maxIterations;
        if (done) next = chars.value.map((char) => isSpace(char));
      }

      mask = next;
      if (done) {
        run = null;
        finishRun(current);
      }
    }

    if (local.value) warm();
    else warmActive = false;

    paint();
    if (!run && !warmActive) ticker.pause();
  }

  function measure() {
    const node = root.value;
    if (!node) return;
    const box = node.getBoundingClientRect();
    centers = chars.value.map((char, index) => {
      const cell = cells[index];
      if (isSpace(char) || !cell) return null;
      const rect = cell.getBoundingClientRect();
      return {
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2,
      };
    });
  }

  function reset() {
    stopRun();
    played = false;
    const hidden =
      props.animateOn === 'click' ||
      ((props.animateOn === 'view' || props.animateOn === 'inViewHover') &&
        !prefersReducedMotion());
    target = !hidden;
    mask = chars.value.map((char) => !hidden || isSpace(char));
    heat = chars.value.map(() => 0);
    pointer = null;
    paint();
  }

  watch([() => props.animateOn, chars], reset);

  watch(
    () => props.loop,
    (loop) => {
      if (loop) return;
      if (hold) clearTimeout(hold);
      hold = null;
      pending = null;
    },
  );

  useResizeObserver(root, () => {
    if (!root.value) return;
    const metrics = readFont(root.value);
    forgetFont(metrics.font);
    font = metrics;
    refit();
  });

  watch(
    [() => props.animateOn, () => props.loop, chars, root],
    (_values, _old, onCleanup) => {
      const viewTrigger =
        props.animateOn === 'view' || props.animateOn === 'inViewHover';
      const node = root.value;
      if ((!viewTrigger && !props.loop) || !node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (!visible) return;
          if (viewTrigger && !played) {
            played = true;
            startRun(true);
          }
          const resume = pending;
          pending = null;
          resume?.();
          if (!props.loop) observer.disconnect();
        },
        { threshold: 0.1 },
      );
      observer.observe(node);
      onCleanup(() => {
        observer.disconnect();
        visible = true;
      });
    },
    { flush: 'post' },
  );

  watch(
    frame,
    (current, previous) => {
      if (
        props.effect !== 'flip' ||
        !previous ||
        previous.shown === current.shown ||
        prefersReducedMotion()
      ) {
        return;
      }
      current.revealed.forEach((revealed, index) => {
        const node = cells[index];
        if (!node || isSpace(chars.value[index] ?? ' ')) return;
        if (!revealed) {
          node.animate(flipFrames(58 + Math.random() * 26, 0.3), {
            duration: Math.min(step.value * 0.92, 240),
            easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)',
          });
        } else if (previous.revealed[index] === false) {
          node.animate(flipFrames(90, 0), {
            duration: Math.min(Math.max(step.value * 7, 360), 760),
            easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
          });
        }
      });
    },
    { flush: 'post' },
  );

  function trackPointer(event: MouseEvent) {
    if (prefersReducedMotion()) return;
    if (!pointer) measure();
    pointer = { x: event.clientX, y: event.clientY };
    ensureTicker();
  }

  function handleMouseEnter(event: MouseEvent) {
    if (!hoverable.value) return;
    if (local.value) {
      trackPointer(event);
      return;
    }
    if (run) return;
    startRun(true, { from: chars.value.map((char) => isSpace(char)) });
  }

  function handleMouseMove(event: MouseEvent) {
    if (hoverable.value && local.value) trackPointer(event);
  }

  function handleMouseLeave() {
    if (!hoverable.value) return;
    if (local.value) {
      pointer = null;
      return;
    }
    stopRun();
    target = true;
    mask = chars.value.map(() => true);
    paint();
    if (props.loop && props.animateOn === 'inViewHover') {
      schedule(
        () => startRun(false, { cycle: true }),
        Math.max(0, props.loopDelay),
      );
    }
  }

  function handleClick() {
    if (props.animateOn !== 'click') return;
    if (props.clickMode === 'toggle') {
      startRun(!target);
      return;
    }
    if (!target) startRun(true);
  }

  const groups = computed(() => {
    const result: DecryptedTextGroup[] = [];
    let word: DecryptedTextGroup | null = null;
    chars.value.forEach((char, index) => {
      if (isSpace(char)) {
        result.push({ key: index, space: char, letters: [] });
        word = null;
        return;
      }
      if (!word) {
        word = { key: index, space: '', letters: [] };
        result.push(word);
      }
      word.letters.push(index);
    });
    return result;
  });

  const tinted = computed(() => Boolean(props.scrambleColor));
  const fading = computed(() => props.effect === 'fade');
  const flipping = computed(() => props.effect === 'flip');
  const settles = computed(() => tinted.value || fading.value);

  function isRevealed(index: number) {
    return frame.value.revealed[index] ?? true;
  }

  function glyphStyle(index: number): CSSProperties {
    const squeeze = frame.value.squeeze[index] ?? 1;
    return {
      position: 'absolute',
      top: '0',
      left: '50%',
      transform:
        squeeze < 1
          ? `translateX(-50%) scaleX(${squeeze})`
          : 'translateX(-50%)',
    };
  }

  function cellStyle(index: number): CSSProperties {
    const revealed = isRevealed(index);
    const style: CSSProperties =
      revealed && !flipping.value
        ? {}
        : { position: 'relative', display: 'inline-block' };
    if (settles.value) {
      style.transition = revealed
        ? SETTLE
        : `color 0.12s linear, opacity ${step.value}ms linear`;
    }
    if (tinted.value && !revealed) {
      const amount = Math.round((frame.value.tint[index] ?? 1) * 100);
      style.color =
        amount >= 100
          ? props.scrambleColor
          : `color-mix(in srgb, ${props.scrambleColor} ${amount}%, currentColor)`;
    }
    if (fading.value) {
      style.opacity = revealed ? 1 : (frame.value.dim[index] ?? FADE_FLOOR);
    }
    return style;
  }

  onMounted(reset);

  onBeforeUnmount(() => {
    if (hold) clearTimeout(hold);
  });
</script>

<template>
  <span
    ref="root"
    :class="cn('inline-block whitespace-pre-wrap', props.class)"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <template v-for="group in groups" :key="group.key">
        <template v-if="group.space">{{ group.space }}</template>
        <span v-else class="whitespace-nowrap">
          <span
            v-for="index in group.letters"
            :key="index"
            :ref="(node) => setCell(index, node)"
            :class="isRevealed(index) ? revealedClass : encryptedClass"
            :style="cellStyle(index)"
          >
            <template v-if="isRevealed(index)">{{ chars[index] }}</template>
            <template v-else>
              <span class="invisible">{{ chars[index] }}</span>
              <span :style="glyphStyle(index)">{{
                frame.shown[index] ?? chars[index]
              }}</span>
            </template>
          </span>
        </span>
      </template>
    </span>
  </span>
</template>
