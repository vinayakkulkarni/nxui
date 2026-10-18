<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import PromptBarGlyph from './PromptBarGlyph.vue';
  import {
    DEFAULT_COMMANDS,
    DEFAULT_EFFORTS,
    DEFAULT_MODELS,
    DEFAULT_SOURCES,
    EDGE,
    LINE,
    parseToken,
  } from './prompt-bar';
  import type {
    PromptBarMenuKind,
    PromptBarProps,
    PromptBarRow,
    PromptBarSendDetail,
    PromptBarSpark,
  } from './types';

  const props = withDefaults(defineProps<PromptBarProps>(), {
    placeholder: 'Ask anything',
    sources: () => DEFAULT_SOURCES,
    commands: () => DEFAULT_COMMANDS,
    models: () => DEFAULT_MODELS,
    defaultModel: '',
    efforts: () => DEFAULT_EFFORTS,
    defaultEffort: '',
    busy: false,
    onAttach: undefined,
    onDictate: undefined,
    background: '#27272a',
    color: '#f5f5f5',
    menuBackground: '#323236',
    sparkColor: '#b39dff',
    sparkBoost: 1,
    width: 400,
    radius: 16,
    maxRows: 5,
    morphDuration: 240,
    squash: 0.12,
    tilt: 8,
    pressScale: 0.96,
    class: '',
  });

  const emit = defineEmits<{
    send: [text: string, detail: PromptBarSendDetail];
    stop: [];
    'effort-change': [effort: string];
  }>();

  const motion = usePreferredReducedMotion();
  const reduce = computed(() => motion.value === 'reduce');

  const rootRef = ref<HTMLDivElement | null>(null);
  const inputRef = ref<HTMLTextAreaElement | null>(null);
  const menuRef = ref<HTMLDivElement | null>(null);
  const glowRef = ref<HTMLSpanElement | null>(null);
  const sparkRef = ref<HTMLCanvasElement | null>(null);

  const draft = ref('');
  const attachments = ref<string[]>([]);
  const modelKey = ref(props.defaultModel);
  const plusOpen = ref(false);
  const modelOpen = ref(false);
  const effortOpen = ref(false);
  const effortIndex = ref(initialEffort());
  const dismissed = ref(false);
  const active = ref(0);
  const listening = ref(false);
  const pressed = ref(false);

  const typing = { energy: 0, strokes: 0 };
  let dictation = 0;
  let lastOpen: PromptBarMenuKind | null = null;

  function initialEffort() {
    const i = props.efforts.indexOf(props.defaultEffort);
    return i >= 0 ? i : Math.max(0, Math.floor((props.efforts.length - 1) / 2));
  }

  const model = computed(
    () => props.models.find((m) => m.key === modelKey.value) ?? props.models[0],
  );
  const token = computed(() =>
    dismissed.value ? null : parseToken(draft.value),
  );
  const open = computed<PromptBarMenuKind | null>(() => {
    if (plusOpen.value) return 'at';
    if (token.value) return token.value.kind;
    if (modelOpen.value) return 'model';
    if (effortOpen.value) return 'effort';
    return null;
  });
  const query = computed(() =>
    plusOpen.value ? '' : (token.value?.query ?? ''),
  );
  const EMPTY: PromptBarRow[] = [];
  const list = computed<PromptBarRow[]>(() => {
    const q = query.value;
    if (open.value === 'at')
      return props.sources.filter((s) => s.name.toLowerCase().includes(q));
    if (open.value === 'slash')
      return props.commands.filter((c) =>
        c.name.replace(/^\//, '').toLowerCase().startsWith(q),
      );
    if (open.value === 'model') return props.models;
    return EMPTY;
  });
  const cursor = computed(() =>
    Math.min(active.value, Math.max(0, list.value.length - 1)),
  );
  const canSend = computed(
    () => draft.value.trim().length > 0 || attachments.value.length > 0,
  );
  const armed = computed(() => props.busy || canSend.value);
  const level = computed(() => props.efforts[effortIndex.value] ?? '');
  const maxed = computed(
    () =>
      props.efforts.length > 1 &&
      effortIndex.value === props.efforts.length - 1,
  );
  const menuLabel = computed(() => {
    if (open.value === 'at') return 'Sources';
    if (open.value === 'slash') return 'Commands';
    if (open.value === 'model') return 'Models';
    return 'Effort';
  });

  const rootStyle = computed(() => ({
    '--pb-bg': props.background,
    '--pb-ink': props.color,
    '--pb-menu': props.menuBackground,
    '--pb-w': `${props.width}px`,
    '--pb-radius': `${props.radius}px`,
    '--pb-spark': props.sparkColor,
    '--pb-press': String(props.pressScale),
  }));

  function stepAt(i: number) {
    const k = i / Math.max(1, props.efforts.length - 1);
    return `calc(${EDGE}px + (100% - ${EDGE * 2}px) * ${k})`;
  }
  function fillAt(i: number) {
    return i === props.efforts.length - 1 ? '100%' : `calc(${stepAt(i)} + 7px)`;
  }
  const trackStyle = computed(() => ({
    '--pb-effort-x': stepAt(effortIndex.value),
    '--pb-effort-fill': fillAt(effortIndex.value),
  }));

  function focusInput() {
    inputRef.value?.focus({ preventScroll: true });
  }
  function closeMenus() {
    plusOpen.value = false;
    modelOpen.value = false;
    effortOpen.value = false;
  }

  // Sliding highlight behind the active row.
  watch(
    [open, cursor, list],
    () => {
      const kind = open.value;
      if (!kind) {
        lastOpen = null;
        return;
      }
      const glow = glowRef.value;
      if (!glow) return;
      const rows =
        menuRef.value?.querySelectorAll<HTMLElement>('.prompt-bar__row');
      const row = rows?.[cursor.value];
      if (!row) {
        glow.style.opacity = '0';
        return;
      }
      const fresh = lastOpen !== kind;
      lastOpen = kind;
      if (fresh) glow.style.transition = 'none';
      glow.style.top = `${row.offsetTop}px`;
      glow.style.height = `${row.offsetHeight}px`;
      glow.style.opacity = '1';
      if (fresh) {
        void glow.offsetHeight;
        glow.style.transition = '';
      }
    },
    { flush: 'post' },
  );

  useEventListener(
    () =>
      plusOpen.value || modelOpen.value || effortOpen.value ? document : null,
    'pointerdown',
    (e: PointerEvent) => {
      const target = e.target;
      if (target instanceof Node && rootRef.value?.contains(target)) return;
      closeMenus();
    },
  );

  // Grow the textarea with its content up to maxRows.
  watch(
    [draft, () => props.maxRows],
    () => {
      const el = inputRef.value;
      if (!el) return;
      el.style.height = '0px';
      const max = LINE * props.maxRows;
      el.style.height = `${Math.min(el.scrollHeight, max)}px`;
      el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
    },
    { flush: 'post', immediate: true },
  );

  // Sparks at the top effort.
  const visible = ref(true);
  useIntersectionObserver(sparkRef, (entries) => {
    visible.value = entries.some((entry) => entry.isIntersecting);
  });
  let raf = 0;
  let sparkW = 0;
  let sparkH = 0;
  let sparkCtx: CanvasRenderingContext2D | null = null;
  let parts: PromptBarSpark[] = [];
  let last = 0;
  let due = 0;
  let speed = 1;
  let pulse = 0;

  function resizeSparks() {
    const canvas = sparkRef.value;
    if (!canvas || !sparkCtx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    sparkW = rect.width;
    sparkH = rect.height;
    canvas.width = Math.round(sparkW * dpr);
    canvas.height = Math.round(sparkH * dpr);
    sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  useResizeObserver(sparkRef, resizeSparks);

  function spawn(burst: boolean) {
    parts.push({
      x: Math.random() * sparkW,
      y: burst ? sparkH * (0.2 + Math.random() * 0.8) : sparkH + 3,
      r: 0.9 + Math.random() * 1.1,
      vy: -(7 + Math.random() * 9),
      sway: (Math.random() - 0.5) * 10,
      phase: Math.random() * Math.PI * 2,
      life: burst ? Math.random() * 1.2 : 0,
      span: 2.4 + Math.random() * 2.4,
    });
  }

  function tick(now: number) {
    const ctx = sparkCtx;
    if (!ctx) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const gain = props.sparkBoost;
    typing.energy *= Math.exp(-dt / 0.8);
    pulse *= Math.exp(-dt / 0.16);
    if (typing.strokes > 0) {
      typing.strokes = 0;
      if (gain > 0) pulse = 1;
    }
    const energy = typing.energy * gain;
    speed += (1 + energy * 6 - speed) * (1 - Math.exp(-dt / 0.15));
    due += dt;
    while (due > 0.14) {
      due -= 0.14;
      if (parts.length < 30) spawn(false);
    }
    ctx.clearRect(0, 0, sparkW, sparkH);
    ctx.fillStyle = props.sparkColor;
    ctx.shadowColor = props.sparkColor;
    ctx.shadowBlur = 6 + energy * 10 + pulse * 6;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i]!;
      p.life += dt;
      if (p.life > p.span) {
        parts.splice(i, 1);
        continue;
      }
      const k = p.life / p.span;
      const twinkle =
        0.7 + 0.3 * Math.sin((now / 160) * (1 + energy) + p.phase);
      p.y += p.vy * dt * speed;
      if (p.y < -4) {
        p.y = sparkH + 3;
        p.x = Math.random() * sparkW;
      }
      const edge = Math.min(
        1,
        Math.max(0, p.y / 14),
        Math.max(0, (sparkH - p.y) / 14),
      );
      ctx.globalAlpha =
        Math.min(1, Math.sin(k * Math.PI) * (0.9 + energy * 0.25) * twinkle) *
        edge;
      ctx.beginPath();
      ctx.arc(
        p.x + Math.sin((now / 900) * (1 + energy * 0.8) + p.phase) * p.sway,
        p.y,
        p.r * twinkle * (1 + energy * 0.35),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }

  function stopSparks(clear: boolean) {
    cancelAnimationFrame(raf);
    raf = 0;
    if (clear) {
      sparkCtx?.clearRect(0, 0, sparkW, sparkH);
      parts = [];
      sparkCtx = null;
    }
  }

  watch(
    [maxed, reduce, sparkRef],
    () => {
      const canvas = sparkRef.value;
      if (!maxed.value || reduce.value || !canvas) {
        stopSparks(true);
        return;
      }
      if (sparkCtx) return;
      sparkCtx = canvas.getContext('2d');
      if (!sparkCtx) return;
      typing.strokes = 0;
      due = 0;
      speed = 1;
      pulse = 0;
      resizeSparks();
      for (let i = 0; i < 26; i += 1) spawn(true);
      if (visible.value) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    },
    { flush: 'post' },
  );

  watch(visible, (isVisible) => {
    if (!sparkCtx) return;
    if (isVisible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!isVisible) {
      stopSparks(false);
    }
  });

  onBeforeUnmount(() => {
    dictation += 1;
    stopSparks(true);
  });

  function setEffort(i: number) {
    const next = Math.max(0, Math.min(props.efforts.length - 1, i));
    if (next === effortIndex.value) return;
    effortIndex.value = next;
    emit('effort-change', props.efforts[next]!);
  }
  function effortFromPointer(e: PointerEvent) {
    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const rect = el.getBoundingClientRect();
    const k =
      (e.clientX - rect.left - EDGE) / Math.max(1, rect.width - 2 * EDGE);
    setEffort(Math.round(k * (props.efforts.length - 1)));
  }
  function onTrackDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    if (el instanceof HTMLElement) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture can fail on synthetic pointers; dragging still works.
      }
      el.focus({ preventScroll: true });
    }
    effortFromPointer(e);
  }
  function onTrackMove(e: PointerEvent) {
    if (e.buttons & 1) effortFromPointer(e);
  }
  function onEffortKey(e: KeyboardEvent) {
    let step = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step = -1;
    if (step) {
      e.preventDefault();
      setEffort(effortIndex.value + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setEffort(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setEffort(props.efforts.length - 1);
    } else if (e.key === 'Escape') {
      effortOpen.value = false;
      focusInput();
    }
  }

  function pick(row: PromptBarRow) {
    if (open.value === 'model') {
      modelKey.value = row.key;
      modelOpen.value = false;
      focusInput();
      return;
    }
    const head = token.value
      ? draft.value.slice(0, token.value.start)
      : draft.value;
    if (row.attach) {
      draft.value = head;
      void Promise.resolve(props.onAttach?.()).then((files) => {
        if (!files) return;
        attachments.value = [
          ...attachments.value,
          ...(Array.isArray(files) ? files : [files]),
        ];
      });
    } else if (open.value === 'at') {
      draft.value = `${head}@${row.name} `;
    } else {
      draft.value = `${head}${row.name} `;
    }
    plusOpen.value = false;
    dismissed.value = false;
    focusInput();
  }

  function send() {
    if (!canSend.value || props.busy) return;
    emit('send', draft.value.trim(), {
      attachments: attachments.value,
      model: model.value,
      effort: level.value,
    });
    draft.value = '';
    attachments.value = [];
    dismissed.value = false;
    closeMenus();
    focusInput();
  }

  function toggleListen() {
    if (listening.value) {
      dictation += 1;
      listening.value = false;
      return;
    }
    dictation += 1;
    const seq = dictation;
    listening.value = true;
    Promise.resolve(props.onDictate?.()).then(
      (text) => {
        if (seq !== dictation) return;
        listening.value = false;
        if (text) {
          const d = draft.value;
          draft.value = d.trim() ? `${d.trimEnd()} ${text}` : text;
        }
        focusInput();
      },
      () => {
        if (seq === dictation) listening.value = false;
      },
    );
  }

  function onInput(e: Event) {
    const el = e.target;
    if (!(el instanceof HTMLTextAreaElement)) return;
    draft.value = el.value;
    typing.energy = Math.min(1.6, typing.energy + 0.22);
    typing.strokes = Math.min(4, typing.strokes + 1);
    dismissed.value = false;
    closeMenus();
    active.value = 0;
  }

  function onKeyDown(e: KeyboardEvent) {
    const rows = list.value;
    if (open.value && rows.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : rows.length - 1;
        active.value = (cursor.value + delta) % rows.length;
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        pick(rows[cursor.value]!);
        return;
      }
    }
    if (e.key === 'Escape') {
      if (open.value) {
        e.preventDefault();
        dismissed.value = true;
        closeMenus();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function onFieldDown(e: PointerEvent) {
    if (e.target === e.currentTarget || e.target === inputRef.value)
      closeMenus();
  }

  function togglePlus() {
    modelOpen.value = false;
    effortOpen.value = false;
    active.value = 0;
    plusOpen.value = !plusOpen.value;
    focusInput();
  }
  function toggleModel() {
    plusOpen.value = false;
    effortOpen.value = false;
    const current = model.value;
    active.value = Math.max(0, current ? props.models.indexOf(current) : 0);
    modelOpen.value = !modelOpen.value;
    focusInput();
  }
  function toggleEffort() {
    plusOpen.value = false;
    modelOpen.value = false;
    effortOpen.value = !effortOpen.value;
    focusInput();
  }
  function removeAttachment(i: number) {
    attachments.value = attachments.value.filter((_, j) => j !== i);
  }

  function onSendDown(e: PointerEvent) {
    if (e.button !== 0 || !armed.value) return;
    pressed.value = true;
  }
  function onSendUp() {
    pressed.value = false;
  }
  function onSendClick() {
    if (props.busy) emit('stop');
    else send();
  }

  defineExpose({ focus: focusInput });
</script>

<template>
  <div
    ref="rootRef"
    :class="['prompt-bar', props.class]"
    :data-busy="busy ? '' : undefined"
    :data-max="maxed ? '' : undefined"
    :style="rootStyle"
  >
    <div
      v-if="open"
      ref="menuRef"
      class="prompt-bar__menu"
      :role="open === 'effort' ? 'dialog' : 'listbox'"
      :aria-label="menuLabel"
      :data-kind="open"
    >
      <template v-if="open === 'effort'">
        <div class="prompt-bar__effort-head">
          <span class="prompt-bar__effort-title">Effort</span>
          <span class="prompt-bar__effort-level">{{ level }}</span>
          <span
            class="prompt-bar__effort-help"
            title="Higher effort thinks longer before answering"
          >
            <Icon name="lucide:circle-help" class="size-3.5" />
          </span>
        </div>
        <div class="prompt-bar__effort-ends">
          <span>Faster</span>
          <span>Smarter</span>
        </div>
        <div
          class="prompt-bar__effort-track"
          role="slider"
          tabindex="0"
          aria-label="Effort"
          :aria-valuemin="0"
          :aria-valuemax="efforts.length - 1"
          :aria-valuenow="effortIndex"
          :aria-valuetext="level"
          :style="trackStyle"
          @pointerdown="onTrackDown"
          @pointermove="onTrackMove"
          @keydown="onEffortKey"
        >
          <span class="prompt-bar__effort-fill" />
          <i
            v-for="(label, i) in efforts"
            :key="label"
            class="prompt-bar__effort-dot"
            :style="{ left: stepAt(i) }"
          />
          <span class="prompt-bar__effort-thumb" />
        </div>
      </template>
      <template v-else>
        <span ref="glowRef" class="prompt-bar__glow" aria-hidden="true" />
        <button
          v-for="(row, i) in list"
          :key="row.key"
          type="button"
          role="option"
          :aria-selected="i === cursor"
          class="prompt-bar__row"
          @mousedown.prevent
          @pointerenter="active = i"
          @click="pick(row)"
        >
          <span v-if="open === 'at'" class="prompt-bar__row-icon">
            <Icon v-if="row.icon" :name="row.icon" class="size-3.75" />
          </span>
          <span class="prompt-bar__row-name">{{ row.name }}</span>
          <span v-if="row.description" class="prompt-bar__row-desc">
            {{ row.description }}
          </span>
          <template v-if="open === 'model'">
            <span class="prompt-bar__row-tag">{{ row.tag }}</span>
            <span
              class="prompt-bar__row-check"
              :data-on="row.key === model?.key ? '' : undefined"
            >
              <Icon name="lucide:check" class="size-3.25" />
            </span>
          </template>
        </button>
        <div v-if="list.length === 0" class="prompt-bar__empty">
          No matches for “{{ query }}”
        </div>
      </template>
    </div>

    <div
      class="prompt-bar__field"
      role="presentation"
      :data-max="maxed ? '' : undefined"
      @pointerdown="onFieldDown"
      @click="focusInput"
    >
      <canvas ref="sparkRef" class="prompt-bar__sparks" aria-hidden="true" />
      <div v-if="attachments.length > 0" class="prompt-bar__chips">
        <span
          v-for="(file, i) in attachments"
          :key="`${file}-${i}`"
          class="prompt-bar__chip"
        >
          <Icon name="lucide:file-text" class="size-3" />
          <span class="prompt-bar__chip-name">{{ file }}</span>
          <button
            type="button"
            class="prompt-bar__chip-x"
            :aria-label="`Remove ${file}`"
            @click.stop="removeAttachment(i)"
          >
            <Icon name="lucide:x" class="size-2.5" />
          </button>
        </span>
      </div>

      <textarea
        ref="inputRef"
        class="prompt-bar__input"
        rows="1"
        :value="draft"
        :placeholder="listening ? 'Listening…' : placeholder"
        aria-label="Prompt"
        @input="onInput"
        @focus="closeMenus"
        @keydown="onKeyDown"
      />

      <div class="prompt-bar__bar">
        <button
          type="button"
          class="prompt-bar__tool"
          aria-label="Add files and sources"
          :aria-expanded="plusOpen"
          :data-on="plusOpen ? '' : undefined"
          @mousedown.prevent
          @click="togglePlus"
        >
          <Icon name="lucide:plus" class="size-4" />
        </button>
        <button
          v-if="models.length > 0 && model"
          type="button"
          class="prompt-bar__pick"
          aria-label="Choose model"
          :aria-expanded="modelOpen"
          :data-on="modelOpen ? '' : undefined"
          @mousedown.prevent
          @click="toggleModel"
        >
          <span>{{ model.name }}</span>
          <Icon name="lucide:chevron-down" class="size-3" />
        </button>
        <button
          v-if="efforts.length > 0"
          type="button"
          class="prompt-bar__pick"
          aria-label="Choose effort"
          :aria-expanded="effortOpen"
          :data-on="effortOpen ? '' : undefined"
          :data-max="maxed ? '' : undefined"
          @mousedown.prevent
          @click="toggleEffort"
        >
          <Icon name="lucide:sparkles" class="size-3.25" />
          <span>{{ level }}</span>
        </button>
        <span class="prompt-bar__spacer" />
        <button
          v-if="onDictate"
          type="button"
          class="prompt-bar__tool"
          :aria-label="listening ? 'Stop dictation' : 'Dictate'"
          :aria-pressed="listening"
          :data-on="listening ? '' : undefined"
          @mousedown.prevent
          @click="toggleListen"
        >
          <span v-if="listening" class="prompt-bar__eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <Icon v-else name="lucide:mic" class="size-3.75" />
        </button>
        <button
          type="button"
          class="prompt-bar__send"
          :disabled="!armed"
          :aria-label="busy ? 'Stop' : 'Send'"
          :data-armed="armed ? '' : undefined"
          :data-pressed="pressed ? '' : undefined"
          @mousedown.prevent
          @pointerdown="onSendDown"
          @pointerup="onSendUp"
          @pointercancel="onSendUp"
          @pointerleave="onSendUp"
          @click="onSendClick"
        >
          <PromptBarGlyph
            :busy="busy"
            :morph-duration="morphDuration"
            :squash="squash"
            :tilt="tilt"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .prompt-bar {
    --pb-bg: #27272a;
    --pb-ink: #f5f5f5;
    --pb-menu: #323236;
    --pb-w: 400px;
    --pb-radius: 16px;
    --pb-press: 0.96;
    --pb-spark: #b39dff;
    --pb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --pb-muted: color-mix(in srgb, var(--pb-ink) 55%, transparent);
    --pb-hover: color-mix(in srgb, var(--pb-ink) 8%, transparent);

    position: relative;
    width: min(var(--pb-w), 100%);
    color: var(--pb-ink);
    font-family: inherit;
    font-size: 14px;
    line-height: 22px;
  }

  .prompt-bar__menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    left: 0;
    z-index: 2;
    padding: 4px;
    border-radius: 12px;
    background: var(--pb-menu);
    box-shadow:
      0 10px 30px -10px rgba(0, 0, 0, 0.35),
      0 1px 2px rgba(0, 0, 0, 0.08);
    transform-origin: bottom center;
    animation: prompt-bar-pop 180ms var(--pb-ease-out) both;
  }

  .prompt-bar__menu[data-kind='model'] {
    right: auto;
    width: 200px;
    transform-origin: bottom left;
  }

  @keyframes prompt-bar-pop {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.98);
    }
  }

  .prompt-bar__glow {
    position: absolute;
    right: 4px;
    left: 4px;
    border-radius: 8px;
    background: var(--pb-hover);
    opacity: 0;
    pointer-events: none;
    transition:
      top 220ms var(--pb-ease-out),
      height 220ms var(--pb-ease-out),
      opacity 150ms ease;
  }

  .prompt-bar__row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 36px;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .prompt-bar__row:focus-visible {
    box-shadow: inset 0 0 0 2px
      color-mix(in srgb, var(--pb-ink) 40%, transparent);
  }

  .prompt-bar__row-icon {
    display: inline-flex;
    flex: none;
    justify-content: center;
    width: 20px;
    color: color-mix(in srgb, var(--pb-ink) 70%, transparent);
  }

  .prompt-bar__row-name {
    flex: none;
    font-size: 13px;
    font-weight: 500;
  }

  .prompt-bar__row-desc {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    color: var(--pb-muted);
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .prompt-bar__row-tag {
    flex: none;
    margin-left: auto;
    color: var(--pb-muted);
    font-size: 11px;
  }

  .prompt-bar__row-check {
    display: inline-flex;
    flex: none;
    justify-content: center;
    width: 16px;
    opacity: 0;
  }

  .prompt-bar__row-check[data-on] {
    opacity: 1;
  }

  .prompt-bar__empty {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 8px;
    color: var(--pb-muted);
    font-size: 12px;
  }

  .prompt-bar__field {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: var(--pb-radius);
    background: var(--pb-bg);
    cursor: text;
  }

  .prompt-bar__field::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: radial-gradient(
      140% 120% at 0% 100%,
      color-mix(in srgb, var(--pb-spark) 26%, transparent),
      transparent 62%
    );
    opacity: 0;
    pointer-events: none;
    transition: opacity 500ms ease;
  }

  .prompt-bar__field[data-max]::before {
    opacity: 1;
  }

  .prompt-bar__sparks {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    pointer-events: none;
  }

  .prompt-bar__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .prompt-bar__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 4px 0 8px;
    border-radius: 8px;
    background: var(--pb-hover);
    font-size: 12px;
    animation: prompt-bar-pop 200ms var(--pb-ease-out) both;
  }

  .prompt-bar__chip-name {
    max-width: 144px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .prompt-bar__chip-x {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    outline: none;
    transition:
      opacity 120ms ease,
      background-color 120ms ease;
  }

  .prompt-bar__chip-x:hover,
  .prompt-bar__chip-x:focus-visible {
    background: color-mix(in srgb, var(--pb-ink) 10%, transparent);
    opacity: 1;
  }

  .prompt-bar__input {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    line-height: 22px;
    resize: none;
    outline: none;
    overflow-wrap: anywhere;
  }

  .prompt-bar__input::placeholder {
    color: color-mix(in srgb, var(--pb-ink) 45%, transparent);
  }

  @media (pointer: coarse) {
    .prompt-bar__input {
      font-size: 16px;
    }
  }

  .prompt-bar__bar {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .prompt-bar__spacer {
    flex: 1 1 auto;
  }

  .prompt-bar__tool,
  .prompt-bar__pick,
  .prompt-bar__send {
    flex: none;
    border: 0;
    font: inherit;
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .prompt-bar__tool:focus-visible,
  .prompt-bar__pick:focus-visible,
  .prompt-bar__send:focus-visible,
  .prompt-bar__effort-track:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--pb-ink) 45%, transparent);
  }

  .prompt-bar__tool {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 8px;
    background: transparent;
    color: color-mix(in srgb, var(--pb-ink) 60%, transparent);
    transition:
      background-color 150ms ease,
      color 150ms ease,
      transform 160ms var(--pb-ease-out);
  }

  .prompt-bar__tool:active {
    transform: scale(0.94);
  }

  .prompt-bar__pick {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    border-radius: 8px;
    background: transparent;
    color: color-mix(in srgb, var(--pb-ink) 70%, transparent);
    font-size: 12px;
    font-weight: 500;
    transition:
      background-color 150ms ease,
      color 150ms ease;
  }

  .prompt-bar__tool[data-on],
  .prompt-bar__pick[data-on] {
    background: var(--pb-hover);
    color: var(--pb-ink);
  }

  @media (hover: hover) and (pointer: fine) {
    .prompt-bar__tool:hover,
    .prompt-bar__pick:hover {
      background: var(--pb-hover);
      color: var(--pb-ink);
    }
  }

  .prompt-bar__pick[data-max] {
    color: var(--pb-spark);
  }

  .prompt-bar__menu[data-kind='effort'] {
    right: auto;
    width: 248px;
    padding: 12px 14px 14px;
    transform-origin: bottom left;
  }

  .prompt-bar__effort-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 18px;
  }

  .prompt-bar__effort-title {
    color: var(--pb-muted);
  }

  .prompt-bar__effort-level {
    font-weight: 500;
  }

  .prompt-bar__effort-help {
    display: inline-flex;
    margin-left: auto;
    color: var(--pb-muted);
  }

  .prompt-bar__effort-ends {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    color: var(--pb-muted);
    font-size: 12px;
    line-height: 16px;
  }

  .prompt-bar__effort-track {
    position: relative;
    height: 22px;
    margin-top: 8px;
    border-radius: 11px;
    background: var(--pb-hover);
    cursor: pointer;
    outline: none;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .prompt-bar__effort-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--pb-effort-fill);
    border-radius: 11px;
    background: color-mix(in srgb, var(--pb-ink) 18%, transparent);
    transition:
      width 220ms var(--pb-ease-out),
      background-color 300ms ease;
  }

  .prompt-bar__effort-dot {
    position: absolute;
    top: 50%;
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pb-ink) 30%, transparent);
  }

  .prompt-bar__effort-thumb {
    position: absolute;
    top: -3px;
    left: var(--pb-effort-x);
    width: 14px;
    height: 28px;
    margin-left: -7px;
    border-radius: 7px;
    background: var(--pb-ink);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition:
      left 220ms var(--pb-ease-out),
      background-color 300ms ease;
  }

  .prompt-bar[data-max] .prompt-bar__effort-fill {
    background: color-mix(in srgb, var(--pb-spark) 35%, transparent);
  }

  .prompt-bar[data-max] .prompt-bar__effort-thumb {
    background: var(--pb-spark);
  }

  .prompt-bar__eq {
    display: flex;
    align-items: center;
    gap: 2.5px;
    height: 14px;
  }

  .prompt-bar__eq i {
    display: block;
    width: 2.5px;
    height: 100%;
    border-radius: 999px;
    background: currentColor;
    transform-origin: center;
    animation: prompt-bar-eq 900ms ease-in-out infinite;
  }

  .prompt-bar__eq i:nth-child(2) {
    animation-delay: 150ms;
  }

  .prompt-bar__eq i:nth-child(3) {
    animation-delay: 300ms;
  }

  @keyframes prompt-bar-eq {
    0%,
    100% {
      transform: scaleY(0.35);
    }

    50% {
      transform: scaleY(1);
    }
  }

  .prompt-bar__send {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 8px;
    background: color-mix(in srgb, var(--pb-ink) 12%, var(--pb-bg));
    color: color-mix(in srgb, var(--pb-ink) 55%, var(--pb-bg));
    transition:
      background-color 200ms ease,
      color 200ms ease,
      transform 160ms var(--pb-ease-out);
  }

  .prompt-bar__send:disabled {
    cursor: default;
  }

  .prompt-bar__send[data-armed] {
    background: var(--pb-ink);
    color: var(--pb-bg);
  }

  .prompt-bar__send[data-pressed] {
    transform: scale(var(--pb-press));
  }

  @media (prefers-reduced-motion: reduce) {
    .prompt-bar__menu,
    .prompt-bar__chip {
      animation: none;
    }

    .prompt-bar__glow {
      transition: opacity 150ms ease;
    }

    .prompt-bar__effort-fill,
    .prompt-bar__effort-thumb {
      transition: background-color 300ms ease;
    }

    .prompt-bar__tool:active,
    .prompt-bar__send[data-pressed] {
      transform: none;
    }
  }
</style>
