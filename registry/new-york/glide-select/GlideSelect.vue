<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type {
    GlideSelectOption,
    GlideSelectPhase,
    GlideSelectPlacement,
    GlideSelectProps,
  } from './types';
  import {
    DEFAULT_OPTIONS,
    GAP,
    MENU_GAP,
    PAD,
    SIZES,
    norm,
    typeaheadIndex,
  } from './glide-select-utils';

  const props = withDefaults(defineProps<GlideSelectProps>(), {
    options: () => DEFAULT_OPTIONS,
    modelValue: undefined,
    defaultValue: undefined,
    placeholder: 'Select…',
    showTags: true,
    accentColor: '#f5f5f5',
    surfaceColor: '#27272a',
    highlightColor: '#3f3f46',
    textColor: '#f5f5f5',
    size: 'md',
    radius: 10,
    menuWidth: 176,
    placement: 'bottom',
    align: 'left',
    popDuration: 180,
    glideDuration: 220,
    rememberPosition: true,
    disabled: false,
    ariaLabel: 'Select',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string, option: GlideSelectOption];
  }>();

  const items = computed(() => props.options.map(norm));
  const inner = ref(props.defaultValue ?? '');
  const current = computed(() => props.modelValue ?? inner.value);
  const selected = computed(() =>
    items.value.findIndex((it) => it.value === current.value),
  );
  const selectedLabel = computed(() => {
    const it = items.value[selected.value];
    return it ? it.label : props.placeholder;
  });

  const phase = ref<GlideSelectPhase>('closed');
  const active = ref<number | null>(null);
  const side = ref<GlideSelectPlacement>(props.placement);

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const triggerRef = useTemplateRef<HTMLButtonElement>('trigger');
  const menuRef = useTemplateRef<HTMLDivElement>('menu');
  const pillRef = useTemplateRef<HTMLSpanElement>('pill');

  let instant = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let scrub: { id: number; top: number } | null = null;

  const id = useId();
  const preset = computed(() => SIZES[props.size] ?? SIZES.md);
  const step = computed(() => preset.value.row + GAP);
  const popOut = computed(() => Math.round((props.popDuration * 2) / 3));
  const origin = computed(
    () => `${side.value === 'bottom' ? 'top' : 'bottom'} ${props.align}`,
  );

  const rootStyle = computed(() => ({
    '--gs-accent': props.accentColor,
    '--gs-surface': props.surfaceColor,
    '--gs-highlight': props.highlightColor,
    '--gs-text': props.textColor,
    '--gs-radius': `${props.radius}px`,
    '--gs-inner-radius': `${Math.max(3, props.radius - 4)}px`,
    '--gs-chip': `${preset.value.chip}px`,
    '--gs-row': `${preset.value.row}px`,
    '--gs-font': `${preset.value.font}px`,
    '--gs-menu-w': `${props.menuWidth}px`,
    '--gs-pop': `${props.popDuration}ms`,
    '--gs-pop-out': `${popOut.value}ms`,
    '--gs-glide': `${props.glideDuration}ms`,
    '--gs-origin': origin.value,
  }));

  function resolveSide(rect: DOMRect, need: number): GlideSelectPlacement {
    if (
      props.placement === 'bottom' &&
      rect.bottom + need > window.innerHeight
    ) {
      return 'top';
    }
    if (props.placement === 'top' && rect.top - need < 0) return 'bottom';
    return props.placement;
  }

  watch(
    phase,
    (p) => {
      if (p !== 'open') return;
      const el = menuRef.value;
      const root = rootRef.value;
      if (!el || !root) return;
      side.value = resolveSide(
        root.getBoundingClientRect(),
        el.offsetHeight + MENU_GAP,
      );
      el.style.transitionDuration = instant ? '0ms' : '';
      el.dataset.state = 'closed';
      void el.offsetHeight;
      el.dataset.state = 'open';
      const pill = pillRef.value;
      if (pill) {
        pill.style.transition = 'none';
        pill.style.transform = `translateY(${Math.max(0, selected.value) * step.value}px)`;
        pill.style.opacity = '0';
        void pill.offsetHeight;
        pill.style.transition = '';
      }
    },
    { flush: 'post' },
  );

  watch(
    [active, phase, step],
    ([a, p, s]) => {
      const pill = pillRef.value;
      if (!pill || p !== 'open') return;
      if (a === null) {
        pill.style.opacity = '0';
        return;
      }
      const jump = instant || pill.style.opacity !== '1';
      pill.style.transitionDuration = jump ? '0ms, 150ms' : '';
      pill.style.transform = `translateY(${a * s}px)`;
      pill.style.opacity = '1';
      instant = false;
    },
    { flush: 'post' },
  );

  function open(viaKey: boolean) {
    if (props.disabled) return;
    clearTimeout(closeTimer);
    instant = true;
    if (selected.value >= 0) active.value = selected.value;
    else active.value = viaKey ? 0 : null;
    phase.value = 'open';
  }

  function close(mode: 'instant' | 'pop') {
    active.value = null;
    clearTimeout(closeTimer);
    const el = menuRef.value;
    if (mode === 'instant' || !el) {
      phase.value = 'closed';
      return;
    }
    el.style.transitionDuration = '';
    el.dataset.state = 'closed';
    phase.value = 'closing';
    closeTimer = setTimeout(() => {
      phase.value = 'closed';
    }, popOut.value + 20);
  }

  function pick(i: number, viaKey: boolean) {
    const it = items.value[i];
    if (!it) {
      close('instant');
      return;
    }
    if (it.value !== current.value) {
      if (props.modelValue === undefined) inner.value = it.value;
      emit('update:modelValue', it.value);
      emit('change', it.value, it);
      if (!viaKey && rootRef.value) rootRef.value.dataset.swap = '';
    }
    close('instant');
    triggerRef.value?.focus({ preventScroll: true, focusVisible: viaKey });
  }

  function handleTriggerPointerDown(e: PointerEvent) {
    if (e.button !== 0 || props.disabled) return;
    triggerRef.value?.focus({ preventScroll: true, focusVisible: false });
    if (phase.value === 'open') close('pop');
    else open(false);
  }

  function goTo(e: KeyboardEvent, i: number) {
    e.preventDefault();
    instant = true;
    active.value = Math.min(items.value.length - 1, Math.max(0, i));
  }

  function handleTriggerKey(e: KeyboardEvent) {
    const k = e.key;
    const n = items.value.length;
    const cur = active.value ?? Math.max(0, selected.value);
    if (phase.value !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
      return;
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      if (active.value === null) goTo(e, cur);
      else goTo(e, cur + (k === 'ArrowDown' ? 1 : -1));
    } else if (k === 'Home' || k === 'End') {
      goTo(e, k === 'Home' ? 0 : n - 1);
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(cur, true);
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault();
      close('instant');
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      goTo(e, typeaheadIndex(items.value, cur, k));
    }
  }

  useEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      if (phase.value === 'closed') return;
      const root = rootRef.value;
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        close('pop');
      }
    },
    { capture: true },
  );

  watch(
    () => props.disabled,
    (d) => {
      if (d && phase.value !== 'closed') close('instant');
    },
  );

  onBeforeUnmount(() => clearTimeout(closeTimer));

  function rowAt(y: number): number | null {
    const s = scrub;
    if (!s) return null;
    const i = Math.floor((y - s.top - PAD) / step.value);
    return i >= 0 && i < items.value.length ? i : null;
  }

  function handleListDown(e: PointerEvent) {
    if (scrub) return;
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // capture is best-effort
    }
    scrub = { id: e.pointerId, top: target.getBoundingClientRect().top };
    instant = true;
    active.value = rowAt(e.clientY);
  }

  function handleListMove(e: PointerEvent) {
    if (!scrub || scrub.id !== e.pointerId) return;
    const i = rowAt(e.clientY);
    if (i !== active.value) active.value = i;
  }

  function handleListUp(e: PointerEvent) {
    if (!scrub || scrub.id !== e.pointerId) return;
    const i = e.type === 'pointerup' ? rowAt(e.clientY) : null;
    scrub = null;
    if (i !== null) pick(i, false);
    else if (!props.rememberPosition) active.value = null;
  }

  function handleListOver(e: PointerEvent) {
    if (e.pointerType === 'touch' || scrub) return;
    if (!(e.target instanceof Element)) return;
    const row = e.target.closest<HTMLElement>('[data-index]');
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== active.value) active.value = i;
  }

  function handleListLeave() {
    if (!scrub && !props.rememberPosition) active.value = null;
  }

  function handleAnimationEnd(e: AnimationEvent) {
    // Scoped CSS suffixes keyframe names with a hash, so match by prefix.
    if (e.animationName.startsWith('gs-swap') && rootRef.value) {
      delete rootRef.value.dataset.swap;
    }
  }
</script>

<template>
  <div
    ref="root"
    :class="['glide-select', props.class]"
    :data-size="size"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
    @animationend="handleAnimationEnd"
  >
    <button
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="phase === 'open'"
      :aria-controls="`${id}-list`"
      :aria-activedescendant="active !== null ? `${id}-${active}` : undefined"
      :aria-label="ariaLabel"
      :disabled="disabled"
      class="glide-select__trigger"
      @pointerdown="handleTriggerPointerDown"
      @keydown="handleTriggerKey"
    >
      <span
        :key="current"
        class="glide-select__label"
        :data-empty="selected < 0 ? '' : undefined"
      >
        {{ selectedLabel }}
      </span>
      <span class="glide-select__chevron" aria-hidden="true">
        <Icon name="lucide:chevron-down" class="size-3" />
      </span>
    </button>
    <div
      v-if="phase !== 'closed'"
      ref="menu"
      class="glide-select__menu"
      data-state="open"
      :data-side="side"
      :data-align="align"
    >
      <div
        :id="`${id}-list`"
        role="listbox"
        :aria-label="ariaLabel"
        class="glide-select__list"
        :data-live="active !== null ? '' : undefined"
        @pointerover="handleListOver"
        @pointerleave="handleListLeave"
        @pointerdown="handleListDown"
        @pointermove="handleListMove"
        @pointerup="handleListUp"
        @pointercancel="handleListUp"
        @lostpointercapture="handleListUp"
      >
        <span ref="pill" class="glide-select__pill" aria-hidden="true" />
        <div
          v-for="(it, i) in items"
          :id="`${id}-${i}`"
          :key="it.value"
          role="option"
          :aria-selected="i === selected"
          :data-index="i"
          class="glide-select__option"
        >
          <span class="glide-select__name">{{ it.label }}</span>
          <span v-if="showTags && it.tag" class="glide-select__tag">
            {{ it.tag }}
          </span>
          <span
            class="glide-select__check"
            :data-on="i === selected ? '' : undefined"
            aria-hidden="true"
          >
            <Icon name="lucide:check" class="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .glide-select {
    --gs-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-block;
  }

  .glide-select[data-disabled] {
    opacity: 0.5;
  }

  .glide-select__trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--gs-chip);
    margin: 0;
    padding: 0 8px 0 10px;
    border: 0;
    border-radius: var(--gs-inner-radius);
    background: var(--gs-surface);
    color: var(--gs-text);
    font-family: inherit;
    font-size: var(--gs-font);
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      background-color 100ms ease,
      transform 160ms var(--gs-ease-out);
  }

  .glide-select__trigger:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gs-accent) 70%, transparent);
  }

  .glide-select__trigger:disabled {
    cursor: default;
  }

  @media (hover: hover) and (pointer: fine) {
    .glide-select__trigger:not(:disabled):hover {
      background: color-mix(
        in srgb,
        var(--gs-highlight) 60%,
        var(--gs-surface)
      );
    }
  }

  .glide-select__trigger[aria-expanded='true'] {
    background: color-mix(in srgb, var(--gs-highlight) 60%, var(--gs-surface));
  }

  .glide-select__trigger:not(:disabled):active {
    transform: scale(0.97);
  }

  .glide-select__label[data-empty] {
    opacity: 0.6;
  }

  .glide-select[data-swap] .glide-select__label {
    animation: gs-swap 160ms ease;
  }

  @keyframes gs-swap {
    from {
      opacity: 0.6;
      filter: blur(2px);
    }
  }

  .glide-select__chevron {
    display: inline-flex;
    color: color-mix(in srgb, var(--gs-text) 55%, transparent);
    transition: transform 200ms var(--gs-ease-out);
  }

  .glide-select__trigger[aria-expanded='true'] .glide-select__chevron {
    transform: rotate(180deg);
  }

  .glide-select__menu {
    position: absolute;
    z-index: 20;
    width: var(--gs-menu-w);
    min-width: 100%;
    padding: 4px;
    border-radius: var(--gs-radius);
    background: var(--gs-surface);
    box-shadow: 0 4px 16px color-mix(in srgb, #000 22%, transparent);
    transform-origin: var(--gs-origin);
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity var(--gs-pop) var(--gs-ease-out),
      transform var(--gs-pop) var(--gs-ease-out);
  }

  .glide-select__menu[data-state='open'] {
    opacity: 1;
    transform: none;
  }

  .glide-select__menu[data-state='closed'] {
    transition-duration: var(--gs-pop-out);
    pointer-events: none;
  }

  .glide-select__menu[data-side='bottom'] {
    top: calc(100% + 6px);
  }

  .glide-select__menu[data-side='top'] {
    bottom: calc(100% + 6px);
  }

  .glide-select__menu[data-align='left'] {
    left: 0;
  }

  .glide-select__menu[data-align='right'] {
    right: 0;
  }

  .glide-select__list {
    position: relative;
    display: grid;
    gap: 1px;
    touch-action: none;
  }

  .glide-select__pill {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: var(--gs-row);
    border-radius: var(--gs-inner-radius);
    background: var(--gs-highlight);
    opacity: 0;
    pointer-events: none;
    transition:
      transform var(--gs-glide) var(--gs-ease-out),
      opacity 150ms ease;
  }

  .glide-select__option {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--gs-row);
    padding: 0 8px 0 10px;
    border-radius: var(--gs-inner-radius);
    color: var(--gs-text);
    font-size: var(--gs-font);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 150ms ease;
  }

  .glide-select__option[aria-selected='true'] {
    background: color-mix(in srgb, var(--gs-highlight) 60%, transparent);
  }

  .glide-select__list[data-live] .glide-select__option[aria-selected='true'] {
    background: transparent;
  }

  .glide-select__name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .glide-select__tag {
    flex-shrink: 0;
    color: color-mix(in srgb, var(--gs-text) 55%, transparent);
    font-size: calc(var(--gs-font) - 2px);
  }

  .glide-select__check {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--gs-accent);
    visibility: hidden;
  }

  .glide-select__check[data-on] {
    visibility: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    .glide-select__menu {
      transform: none !important;
      transition: opacity var(--gs-pop) ease;
    }

    .glide-select__menu[data-state='closed'] {
      transition-duration: var(--gs-pop-out);
    }

    .glide-select__pill {
      transition: opacity 150ms ease;
    }

    .glide-select__chevron {
      transition: none;
    }

    .glide-select__trigger {
      transition: background-color 100ms ease;
    }

    .glide-select__trigger:not(:disabled):active {
      transform: none;
    }

    .glide-select[data-swap] .glide-select__label {
      animation: none;
    }
  }
</style>
