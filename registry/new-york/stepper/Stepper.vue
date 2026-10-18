<script setup lang="ts">
  import { computed, onMounted, ref, useSlots, watch } from 'vue';
  import type { ComponentPublicInstance, Slot } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import StepperCheck from './StepperCheck.vue';
  import {
    STEPPER_SETTLE,
    STEPPER_SPRING,
    STEPPER_THEMES,
    buttonAttrs,
    clampStep,
    collectSteps,
    readableOn,
    springEase,
  } from './stepper-theme';
  import type {
    StepperIndicatorSlotProps,
    StepperProps,
    StepperStatus,
    StepperView,
  } from './types';

  const props = withDefaults(defineProps<StepperProps>(), {
    initialStep: 1,
    indicator: 'numbers',
    orientation: 'horizontal',
    transition: 'slide',
    linear: false,
    disableStepIndicators: false,
    showFooter: true,
    backButtonText: 'Back',
    nextButtonText: 'Continue',
    completeButtonText: 'Complete',
    backButtonProps: () => ({}),
    nextButtonProps: () => ({}),
    theme: 'dark',
    accentColor: undefined,
    frame: true,
    radius: 24,
    width: 440,
    class: '',
    stepContainerClass: '',
    contentClass: '',
    footerClass: '',
  });

  const emit = defineEmits<{
    stepChange: [step: number];
    finalStepCompleted: [];
  }>();

  defineSlots<{
    default?: Slot;
    completed?: Slot;
    indicator?: (props: StepperIndicatorSlotProps) => unknown;
  }>();

  /** Current step (1-based). Optional — leave unbound to let the stepper own it. */
  const stepModel = defineModel<number>('step');

  const slots = useSlots();
  const entries = computed(() => collectSteps(slots.default?.() ?? []));
  const total = computed(() => entries.value.length);

  const internal = ref(props.initialStep);
  const current = computed(() =>
    clampStep(
      Math.round(stepModel.value ?? internal.value),
      1,
      total.value + 1,
    ),
  );
  const completed = computed(() => current.value > total.value);
  const vertical = computed(() => props.orientation === 'vertical');
  const kind = computed(() => (vertical.value ? 'numbers' : props.indicator));
  const labelled = computed(() => entries.value.some((entry) => entry.title));
  const isLast = computed(() => current.value === total.value);

  const compact = ref(false);
  const tight = ref(false);
  const rail = computed(() => vertical.value && !compact.value);
  const reached = ref(current.value);

  const view = ref<StepperView>({
    step: current.value,
    previous: null,
    direction: 1,
    id: 0,
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const trackRef = ref<HTMLDivElement | null>(null);
  const gliderRef = ref<HTMLSpanElement | null>(null);
  const viewportRef = ref<HTMLDivElement | null>(null);
  const paneRef = ref<HTMLDivElement | null>(null);
  const leavingRef = ref<HTMLDivElement | null>(null);
  const markerEls: (HTMLElement | null)[] = [];
  const titleEls: (HTMLElement | null)[] = [];
  const labelWidths: number[] = [];
  let heightFrom = 0;
  let paneHadFocus = false;
  let placed = false;

  function go(target: number): void {
    const next = clampStep(target, 1, total.value + 1);
    if (next === current.value) return;
    internal.value = next;
    stepModel.value = next;
    if (next > total.value) emit('finalStepCompleted');
    else emit('stepChange', next);
  }

  function reachable(number: number): boolean {
    return (
      !props.disableStepIndicators &&
      number !== current.value &&
      (!props.linear || number <= Math.min(reached.value, total.value))
    );
  }

  function statusOf(number: number): StepperStatus {
    if (completed.value || number < current.value) return 'complete';
    return number === current.value ? 'active' : 'upcoming';
  }

  function stepLabel(number: number, title?: string): string {
    return title ? `Step ${number}: ${title}` : `Step ${number}`;
  }

  function setMarker(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    markerEls[index] = el instanceof HTMLElement ? el : null;
  }

  function setTitle(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    titleEls[index] = el instanceof HTMLElement ? el : null;
  }

  function reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Folds the vertical rail into a row on narrow widths and hides titles
  // when the row cannot fit them.
  function measure(): void {
    const root = rootRef.value;
    if (!root) return;
    const folded = vertical.value && root.clientWidth < 520;
    compact.value = folded;
    const track = trackRef.value;
    if (!track || !labelled.value || (vertical.value && !folded)) {
      tight.value = false;
      return;
    }
    const segments = markerEls.slice(0, total.value);
    if (!tight.value) {
      segments.forEach((segment, index) => {
        const title = titleEls[index];
        labelWidths[index] =
          title && segment?.contains(title) ? title.scrollWidth + 8 : 0;
      });
    }
    const badges = segments.reduce(
      (sum, segment) =>
        sum +
        (segment?.firstElementChild?.getBoundingClientRect().width ?? 22) +
        20,
      0,
    );
    const labels = labelWidths
      .slice(0, total.value)
      .reduce((sum, value) => sum + (value || 0), 0);
    const room = track.clientWidth - 8 - 4 * Math.max(0, total.value - 1);
    tight.value = badges + labels > room + 0.5;
  }

  function place(animate: boolean): void {
    const glider = gliderRef.value;
    if (!trackRef.value || !glider) return;
    const segment = markerEls[Math.min(current.value, total.value) - 1];
    if (!segment) return;
    const spring = springEase();
    glider.style.transition = animate
      ? `transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease`
      : 'opacity 200ms ease';
    glider.style.transform = `translate3d(${segment.offsetLeft}px, ${segment.offsetTop}px, 0)`;
    glider.style.width = `${segment.offsetWidth}px`;
    glider.style.height = `${segment.offsetHeight}px`;
    glider.style.opacity = completed.value ? '0' : '1';
  }

  function animateView(id: number): void {
    if (id === 0) return;
    const viewport = viewportRef.value;
    const pane = paneRef.value;
    const leaving = leavingRef.value;
    const reduced = reducedMotion();
    const mode =
      props.transition === 'none'
        ? 'none'
        : reduced
          ? 'fade'
          : props.transition;
    const finish = (): void => {
      if (view.value.id === id) view.value = { ...view.value, previous: null };
    };
    if (paneHadFocus && pane) pane.focus({ preventScroll: true });
    paneHadFocus = false;
    if (
      !viewport ||
      typeof viewport.animate !== 'function' ||
      mode === 'none'
    ) {
      finish();
      return;
    }
    for (const element of [viewport, pane, leaving]) {
      element?.getAnimations().forEach((animation) => animation.cancel());
    }
    const to = viewport.offsetHeight;
    const spring = springEase();
    if (Math.abs(heightFrom - to) > 0.5) {
      viewport.animate([{ height: `${heightFrom}px` }, { height: `${to}px` }], {
        duration: reduced ? 200 : 560,
        easing: reduced ? STEPPER_SETTLE : spring,
      });
    }
    const axis = vertical.value ? 'Y' : 'X';
    const shift = mode === 'slide' ? 36 : 0;
    if (pane) {
      if (shift) {
        pane.animate(
          [
            {
              transform: `translate${axis}(${view.value.direction * shift}px)`,
            },
            { transform: 'none' },
          ],
          { duration: 560, easing: spring },
        );
      }
      pane.animate(
        [{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }],
        {
          duration: 420,
          easing: 'ease-out',
        },
      );
    }
    if (leaving) {
      leaving.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
        fill: 'forwards',
      });
      const exit = leaving.animate(
        [
          { transform: 'none' },
          { transform: `translate${axis}(${-view.value.direction * shift}px)` },
        ],
        {
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'forwards',
        },
      );
      exit.onfinish = finish;
    } else finish();
  }

  // Before the DOM updates: remember the old height and focus, then swap panes.
  watch(current, (next) => {
    if (next > reached.value) reached.value = next;
    if (view.value.step === next) return;
    heightFrom = viewportRef.value?.offsetHeight ?? 0;
    const active =
      typeof document === 'undefined' ? null : document.activeElement;
    paneHadFocus = !!(active && paneRef.value?.contains(active));
    view.value = {
      step: next,
      previous: view.value.step,
      direction: next > view.value.step ? 1 : -1,
      id: view.value.id + 1,
    };
  });

  watch(() => view.value.id, animateView, { flush: 'post' });

  watch(
    [vertical, labelled, () => props.frame, total, kind, compact],
    measure,
    { flush: 'post' },
  );

  watch(
    [current, total, completed, kind, labelled, vertical, compact, tight],
    () => {
      place(placed && !reducedMotion());
      placed = true;
    },
    { flush: 'post' },
  );

  useResizeObserver(rootRef, measure);
  useResizeObserver(trackRef, () => place(false));

  onMounted(() => {
    measure();
    place(false);
    placed = true;
  });

  const rootStyle = computed(() => ({
    ...STEPPER_THEMES[props.theme],
    '--stepper-radius': `${Math.max(0, props.radius)}px`,
    '--stepper-spring': STEPPER_SPRING,
    '--stepper-width':
      typeof props.width === 'number' ? `${props.width}px` : props.width,
    ...(props.accentColor
      ? {
          '--stepper-solid': props.accentColor,
          '--stepper-solid-ink': readableOn(props.accentColor),
        }
      : {}),
  }));

  const backAttrs = computed(() => buttonAttrs(props.backButtonProps));
  const nextAttrs = computed(() => buttonAttrs(props.nextButtonProps));

  function onBack(event: MouseEvent): void {
    props.backButtonProps.onClick?.(event);
    if (!event.defaultPrevented) go(current.value - 1);
  }

  function onNext(event: MouseEvent): void {
    props.nextButtonProps.onClick?.(event);
    if (!event.defaultPrevented) go(current.value + 1);
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'stepper',
        rail ? 'stepper--vertical' : 'stepper--horizontal',
        frame && 'stepper--framed',
        props.class,
      )
    "
    :data-completed="completed ? '' : undefined"
    :style="rootStyle"
  >
    <div
      :class="
        cn('stepper__header', `stepper__header--${kind}`, stepContainerClass)
      "
    >
      <div v-if="kind === 'dots'" class="stepper__dots">
        <button
          v-for="(entry, index) in entries"
          :key="index"
          type="button"
          class="stepper__dot"
          :data-status="statusOf(index + 1)"
          :aria-label="stepLabel(index + 1, entry.title)"
          :aria-current="index + 1 === current ? 'step' : undefined"
          :disabled="!reachable(index + 1)"
          @click="go(index + 1)"
        >
          <span class="stepper__dot-mark" :data-status="statusOf(index + 1)" />
        </button>
      </div>

      <div v-else-if="kind === 'bars'" class="stepper__bars">
        <button
          v-for="(entry, index) in entries"
          :key="index"
          type="button"
          class="stepper__bar"
          :data-status="statusOf(index + 1)"
          :aria-label="stepLabel(index + 1, entry.title)"
          :aria-current="index + 1 === current ? 'step' : undefined"
          :disabled="!reachable(index + 1)"
          @click="go(index + 1)"
        >
          <span class="stepper__bar-track">
            <span
              class="stepper__bar-fill"
              :data-filled="completed || index + 1 <= current ? '' : undefined"
            />
          </span>
        </button>
      </div>

      <div
        v-else
        ref="trackRef"
        class="stepper__track"
        :data-layout="rail ? 'rail' : 'row'"
      >
        <span ref="gliderRef" class="stepper__glider" aria-hidden="true" />
        <template v-for="(entry, index) in entries" :key="index">
          <div
            v-if="$slots.indicator"
            :ref="(el) => setMarker(index, el)"
            class="stepper__segment"
            :data-status="statusOf(index + 1)"
          >
            <slot
              name="indicator"
              :step="index + 1"
              :current-step="current"
              :status="statusOf(index + 1)"
              :on-step-click="go"
            />
            <span v-if="entry.title && !(tight && !rail)" class="stepper__text">
              <span
                :ref="(el) => setTitle(index, el)"
                class="stepper__title"
                :data-status="statusOf(index + 1)"
              >
                {{ entry.title }}
              </span>
              <span
                v-if="rail && entry.description"
                class="stepper__description"
              >
                {{ entry.description }}
              </span>
            </span>
          </div>
          <button
            v-else
            :ref="(el) => setMarker(index, el)"
            type="button"
            class="stepper__segment"
            :data-status="statusOf(index + 1)"
            :aria-label="stepLabel(index + 1, entry.title)"
            :aria-current="index + 1 === current ? 'step' : undefined"
            :disabled="!reachable(index + 1)"
            @click="go(index + 1)"
          >
            <span class="stepper__badge" :data-status="statusOf(index + 1)">
              <StepperCheck v-if="statusOf(index + 1) === 'complete'" />
              <span v-else-if="entry.icon" class="stepper__glyph">
                <Icon :name="entry.icon" class="size-4" />
              </span>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span v-if="entry.title && !(tight && !rail)" class="stepper__text">
              <span
                :ref="(el) => setTitle(index, el)"
                class="stepper__title"
                :data-status="statusOf(index + 1)"
              >
                {{ entry.title }}
              </span>
              <span
                v-if="rail && entry.description"
                class="stepper__description"
              >
                {{ entry.description }}
              </span>
            </span>
          </button>
        </template>
      </div>
    </div>

    <div class="stepper__body">
      <div
        ref="viewportRef"
        :class="cn('stepper__viewport', contentClass)"
        aria-live="polite"
      >
        <div
          v-if="view.previous !== null"
          :key="view.id - 1"
          ref="leavingRef"
          class="stepper__pane stepper__pane--leaving"
          aria-hidden="true"
        >
          <slot v-if="view.previous > total" name="completed" />
          <component :is="entries[view.previous - 1]?.node" v-else />
        </div>
        <div :key="view.id" ref="paneRef" class="stepper__pane" tabindex="-1">
          <slot v-if="view.step > total" name="completed" />
          <component :is="entries[view.step - 1]?.node" v-else />
        </div>
      </div>

      <div
        v-if="showFooter"
        class="stepper__footer-wrap"
        :data-hidden="completed ? '' : undefined"
        :aria-hidden="completed ? true : undefined"
      >
        <div class="stepper__footer-clip">
          <div :class="cn('stepper__footer', footerClass)">
            <button
              type="button"
              v-bind="backAttrs"
              :class="
                cn(
                  'stepper__button stepper__button--back',
                  backButtonProps.class,
                )
              "
              :data-hidden="current <= 1 ? '' : undefined"
              :tabindex="completed ? -1 : backAttrs.tabindex"
              @click="onBack"
            >
              <Icon name="lucide:chevron-left" class="size-4" />
              <span>{{ backButtonText }}</span>
            </button>
            <button
              type="button"
              v-bind="nextAttrs"
              :class="
                cn(
                  'stepper__button stepper__button--next',
                  nextButtonProps.class,
                )
              "
              :tabindex="completed ? -1 : nextAttrs.tabindex"
              @click="onNext"
            >
              <span>{{ isLast ? completeButtonText : nextButtonText }}</span>
              <Icon
                :name="isLast ? 'lucide:check' : 'lucide:chevron-right'"
                class="size-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <span v-if="frame" class="stepper__rim" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .stepper {
    --stepper-pad: 0px;
    --stepper-inset: 0px;
    --stepper-bleed: 8px;
    --stepper-well-radius: max(6px, calc(var(--stepper-radius) - 8px));
    --stepper-tile-radius: max(4px, calc(var(--stepper-well-radius) - 4px));
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(100%, var(--stepper-width));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: var(--stepper-radius);
    color: var(--stepper-ink);
    -webkit-tap-highlight-color: transparent;
  }

  .stepper--framed {
    --stepper-pad: 8px;
    --stepper-inset: 12px;
    --stepper-bleed: 20px;
    padding: var(--stepper-pad);
    background: var(--stepper-frame);
    box-shadow: var(--stepper-frame-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  .stepper__rim {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--stepper-frame-edge),
      inset 0 1px 0 var(--stepper-frame-highlight);
    pointer-events: none;
  }

  .stepper__header--dots,
  .stepper__header--bars {
    padding: var(--stepper-inset) var(--stepper-inset) 0;
  }

  .stepper__track {
    position: relative;
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: var(--stepper-well-radius);
    background: var(--stepper-well);
  }

  .stepper__glider {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: var(--stepper-tile-radius);
    background: var(--stepper-tile);
    box-shadow:
      inset 0 0 0 1px var(--stepper-tile-edge),
      inset 0 1px 0 var(--stepper-tile-highlight),
      var(--stepper-tile-shadow);
    opacity: 0;
    pointer-events: none;
  }

  .stepper__segment {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 0;
    height: 40px;
    padding: 0 10px;
    box-sizing: border-box;
    border: none;
    border-radius: var(--stepper-tile-radius);
    background: none;
    color: var(--stepper-muted);
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .stepper__segment:disabled {
    cursor: default;
  }

  .stepper__badge {
    display: grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px var(--stepper-faint);
    color: var(--stepper-muted);
    font-size: 11.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    transition:
      background-color 0.15s ease,
      box-shadow 0.15s ease,
      color 0.15s ease;
  }

  .stepper__badge[data-status='active'] {
    box-shadow: inset 0 0 0 1.5px var(--stepper-ink);
    color: var(--stepper-ink);
  }

  .stepper__badge[data-status='complete'] {
    background: var(--stepper-solid);
    box-shadow: none;
    color: var(--stepper-solid-ink);
  }

  .stepper__glyph {
    display: grid;
    place-items: center;
  }

  .stepper__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    text-align: left;
  }

  .stepper__title {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--stepper-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  .stepper__title:not([data-status='upcoming']) {
    color: var(--stepper-ink);
  }

  .stepper__description {
    overflow: hidden;
    font-size: 12px;
    line-height: 1.35;
    color: var(--stepper-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stepper__track[data-layout='rail'] {
    flex: 1;
    flex-direction: column;
  }

  .stepper__track[data-layout='rail'] .stepper__segment {
    flex: none;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;
    height: auto;
    padding: 10px;
  }

  .stepper__track[data-layout='rail'] .stepper__text {
    padding-top: 3px;
  }

  .stepper__dots {
    display: flex;
    justify-content: center;
    gap: 2px;
  }

  .stepper__dot {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }

  .stepper__dot-mark {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--stepper-faint);
    transition:
      background-color 0.25s ease,
      transform 0.45s var(--stepper-spring);
  }

  .stepper__dot-mark[data-status='complete'] {
    background: var(--stepper-muted);
  }

  .stepper__dot-mark[data-status='active'] {
    background: var(--stepper-solid);
    transform: scale(1.3);
  }

  .stepper__bars {
    display: flex;
    gap: 6px;
  }

  .stepper__bar {
    display: flex;
    flex: 1;
    align-items: center;
    height: 18px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .stepper__bar-track {
    position: relative;
    width: 100%;
    height: 4px;
    overflow: hidden;
    border-radius: 4px;
    background: var(--stepper-track);
  }

  .stepper__bar-fill {
    position: absolute;
    inset: 0;
    background: var(--stepper-solid);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 560ms var(--stepper-spring);
  }

  .stepper__bar-fill[data-filled] {
    transform: none;
  }

  .stepper__dot:disabled,
  .stepper__bar:disabled {
    cursor: default;
  }

  .stepper__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 20px var(--stepper-inset) var(--stepper-inset);
  }

  .stepper__viewport {
    position: relative;
    margin: -6px calc(var(--stepper-bleed) * -1);
    overflow: hidden;
  }

  .stepper__pane {
    box-sizing: border-box;
    padding: 6px var(--stepper-bleed);
    outline: none;
  }

  .stepper__pane--leaving {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    pointer-events: none;
  }

  .stepper__footer-wrap {
    display: grid;
    grid-template-rows: 1fr;
    transition:
      grid-template-rows 480ms var(--stepper-spring),
      opacity 0.2s ease;
  }

  .stepper__footer-wrap[data-hidden] {
    grid-template-rows: 0fr;
    opacity: 0;
    pointer-events: none;
  }

  .stepper__footer-clip {
    min-height: 0;
  }

  .stepper__footer-wrap[data-hidden] .stepper__footer-clip {
    overflow: hidden;
  }

  .stepper__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 20px;
  }

  .stepper__button {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 14px;
    border: none;
    border-radius: max(8px, calc(var(--stepper-radius) * 0.5));
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition:
      filter 0.2s ease,
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .stepper__button--back {
    padding-left: 10px;
    background: var(--stepper-tile);
    box-shadow:
      inset 0 0 0 1px var(--stepper-tile-edge),
      inset 0 1px 0 var(--stepper-tile-highlight),
      var(--stepper-tile-shadow);
    color: var(--stepper-ink);
  }

  .stepper__button--back[data-hidden] {
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 0.2s ease,
      visibility 0s 0.2s;
  }

  .stepper__button--next {
    margin-left: auto;
    padding-right: 11px;
    background: var(--stepper-solid);
    box-shadow: 0 4px 12px -6px rgba(0, 0, 0, 0.5);
    color: var(--stepper-solid-ink);
  }

  .stepper__button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .stepper__button:focus-visible,
  .stepper__segment:focus-visible,
  .stepper__dot:focus-visible,
  .stepper__bar:focus-visible {
    outline: 2px solid var(--stepper-ink);
    outline-offset: 2px;
  }

  .stepper--vertical {
    flex-direction: row;
    align-items: stretch;
  }

  .stepper--vertical .stepper__header {
    display: flex;
    flex: none;
    width: 212px;
    max-width: 42%;
  }

  .stepper--vertical .stepper__body {
    flex: 1;
    padding: var(--stepper-inset) var(--stepper-inset) var(--stepper-inset) 20px;
  }

  @media (hover: hover) {
    .stepper__segment:not(:disabled):hover {
      background: var(--stepper-hover-fill);
    }

    .stepper__button--back:not(:disabled):hover {
      filter: var(--stepper-hover);
    }

    .stepper__button--next:not(:disabled):hover {
      filter: var(--stepper-solid-hover);
    }

    .stepper__dot:not(:disabled):hover .stepper__dot-mark {
      transform: scale(1.3);
    }

    .stepper__bar:not(:disabled):hover .stepper__bar-track {
      background: var(--stepper-faint);
    }
  }

  .stepper__button:not(:disabled):active {
    filter: var(--stepper-press);
    transform: scale(0.96);
    transition-duration: 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    .stepper__bar-fill,
    .stepper__dot-mark,
    .stepper__footer-wrap {
      transition-duration: 0.01ms;
    }
  }
</style>
