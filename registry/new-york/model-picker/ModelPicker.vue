<script setup lang="ts">
  import { computed, nextTick, ref, useId } from 'vue';
  import {
    onClickOutside,
    onKeyStroke,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { AnimatePresence, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import ModelPickerEffortControl from './ModelPickerEffort.vue';
  import ModelPickerRow from './ModelPickerRow.vue';
  import ModelPickerToggle from './ModelPickerToggle.vue';
  import ModelPickerTray from './ModelPickerTray.vue';
  import {
    AUTO_KEY,
    COLUMNS,
    DEFAULT_EFFORT_SCALE,
    DEFAULT_HINTS,
    EFFORTS,
  } from './model-picker-constants';
  import { useModelPickerAutoplay } from './use-model-picker-autoplay';
  import type {
    ModelPickerEffortLevel,
    ModelPickerModel,
    ModelPickerProps,
    ModelPickerSubmit,
  } from './types';

  const props = withDefaults(defineProps<ModelPickerProps>(), {
    showAuto: true,
    autoLabel: 'Auto',
    autoTagline: 'Picks per message',
    placeholder: 'Ask anything…',
    accent: '#3b76e1',
    effortScale: () => DEFAULT_EFFORT_SCALE,
    hints: () => DEFAULT_HINTS,
    autoplay: false,
    class: '',
  });

  const emit = defineEmits<{ submit: [payload: ModelPickerSubmit] }>();

  const selected = defineModel<string>({ default: '' });
  const thinking = defineModel<boolean>('thinking', { default: false });
  const effort = defineModel<ModelPickerEffortLevel>('effort', {
    default: 'medium',
  });
  const webSearch = defineModel<boolean>('webSearch', { default: false });
  const prompt = defineModel<string>('prompt', { default: '' });
  const open = defineModel<boolean>('open', { default: false });

  const rootRef = ref<HTMLElement | null>(null);
  const chipRef = ref<HTMLButtonElement | null>(null);
  const menuRef = ref<HTMLElement | null>(null);
  const activeKey = ref<string | null>(null);
  const menuId = `mp-${useId()}`;

  const reducedMotion = usePreferredReducedMotion();
  const animate = computed(() => reducedMotion.value !== 'reduce');

  const current = computed<ModelPickerModel | undefined>(
    () =>
      props.models.find((model) => model.id === selected.value) ??
      props.models[0],
  );
  const isAuto = computed(() => props.showAuto && selected.value === AUTO_KEY);
  const currentKey = computed(() =>
    isAuto.value ? AUTO_KEY : (current.value?.id ?? ''),
  );
  const chipName = computed(() =>
    isAuto.value ? props.autoLabel : (current.value?.name ?? ''),
  );
  const chipGlyph = computed(() => current.value?.glyph ?? chipName.value[0]);
  const rowKeys = computed(() => {
    const keys = props.models.map((model) => model.id);
    return props.showAuto ? [...keys, AUTO_KEY] : keys;
  });
  const hoveringRow = computed(
    () => activeKey.value !== null && rowKeys.value.includes(activeKey.value),
  );

  const scale = computed(() =>
    thinking.value ? (props.effortScale[effort.value] ?? 1) : 1,
  );
  const trayModel = computed(() => {
    const key = activeKey.value ?? currentKey.value;
    return props.models.find((model) => model.id === key);
  });
  const trayHint = computed(() => {
    const key = activeKey.value ?? currentKey.value;
    if (key === 'thinking' || key === 'effort')
      return thinking.value ? props.hints.thinkingOn : props.hints.thinkingOff;
    if (key === 'web')
      return webSearch.value ? props.hints.webOn : props.hints.webOff;
    if (key === AUTO_KEY || !trayModel.value) return props.hints.auto;
    return '';
  });
  const trayLatency = computed(
    () => (trayModel.value?.latency ?? 0) * scale.value,
  );
  const trayPrice = computed(() => trayModel.value?.price ?? 0);

  const menuMotion = computed(() =>
    animate.value
      ? {
          initial: { opacity: 0, y: -6, scale: 0.98, filter: 'blur(4px)' },
          animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, y: -4, scale: 0.98, filter: 'blur(4px)' },
        }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        },
  );

  function items(): HTMLElement[] {
    const menu = menuRef.value;
    if (!menu) return [];
    return [...menu.querySelectorAll<HTMLElement>('[data-mp-item]')];
  }

  function focusKey(key: string): void {
    const item = items().find((element) => element.dataset.key === key);
    if (!item) return;
    item.focus({ preventScroll: true });
    activeKey.value = key;
  }

  function focusIndex(index: number): void {
    const list = items();
    if (list.length === 0) return;
    const item = list[(index + list.length) % list.length];
    if (!item) return;
    item.focus({ preventScroll: true });
    activeKey.value = item.dataset.key ?? null;
  }

  async function openMenu(focus: 'selected' | 'last' | 'menu'): Promise<void> {
    open.value = true;
    await nextTick();
    if (focus === 'menu') menuRef.value?.focus({ preventScroll: true });
    else if (focus === 'last') focusIndex(-1);
    else focusKey(currentKey.value);
  }

  function closeMenu(returnFocus: boolean): void {
    open.value = false;
    activeKey.value = null;
    if (returnFocus) chipRef.value?.focus({ preventScroll: true });
  }

  function onChipClick(event: MouseEvent): void {
    if (open.value) closeMenu(false);
    else void openMenu(event.detail === 0 ? 'selected' : 'menu');
  }

  function onChipKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      void openMenu(event.key === 'ArrowUp' ? 'last' : 'selected');
    }
  }

  function stepEffort(delta: number): void {
    const index = EFFORTS.indexOf(effort.value) + delta;
    const next = EFFORTS[Math.max(0, Math.min(EFFORTS.length - 1, index))];
    if (next) effort.value = next;
    void nextTick(() => focusKey('effort'));
  }

  function onMenuKeydown(event: KeyboardEvent): void {
    const list = items();
    const at = list.findIndex((item) => item.dataset.key === activeKey.value);
    const keyMap: Record<string, () => void> = {
      ArrowDown: () => focusIndex(at + 1),
      ArrowUp: () => focusIndex(at < 0 ? -1 : at - 1),
      Home: () => focusIndex(0),
      End: () => focusIndex(-1),
      ArrowRight: () => {
        if (activeKey.value === 'effort') stepEffort(1);
      },
      ArrowLeft: () => {
        if (activeKey.value === 'effort') stepEffort(-1);
      },
    };
    if (event.key === 'Tab') {
      closeMenu(false);
      return;
    }
    const action = keyMap[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  function onFocusIn(event: FocusEvent): void {
    if (event.target instanceof HTMLElement && event.target.dataset.key)
      activeKey.value = event.target.dataset.key;
  }

  function onHover(key: string): void {
    activeKey.value = key;
    if (menuRef.value?.contains(document.activeElement)) focusKey(key);
  }

  function onMenuLeave(): void {
    activeKey.value = null;
  }

  function onSelect(key: string): void {
    selected.value = key;
    closeMenu(true);
  }

  function onToggle(key: string): void {
    if (key === 'thinking') thinking.value = !thinking.value;
    else webSearch.value = !webSearch.value;
  }

  function onEffort(value: ModelPickerEffortLevel): void {
    effort.value = value;
    focusKey('effort');
  }

  function onSubmit(): void {
    emit('submit', {
      prompt: prompt.value,
      model: currentKey.value,
      thinking: thinking.value,
      effort: effort.value,
      webSearch: webSearch.value,
    });
  }

  onClickOutside(rootRef, () => {
    if (open.value) closeMenu(false);
  });

  onKeyStroke('Escape', (event) => {
    if (!open.value || event.defaultPrevented) return;
    const inside = rootRef.value?.contains(document.activeElement) ?? false;
    closeMenu(inside);
  });

  function hoverStep(key: string): () => void {
    return () => {
      open.value = true;
      activeKey.value = key;
    };
  }

  useModelPickerAutoplay({
    enabled: () => props.autoplay,
    target: () => rootRef.value,
    interval: 1100,
    onStop: () => {
      activeKey.value = null;
    },
    steps: () => {
      const next =
        rowKeys.value[
          (rowKeys.value.indexOf(currentKey.value) + 1) % rowKeys.value.length
        ] ?? currentKey.value;
      return [
        () => {
          open.value = true;
          activeKey.value = null;
        },
        ...rowKeys.value.map((key) => hoverStep(key)),
        hoverStep('thinking'),
        () => {
          thinking.value = true;
        },
        hoverStep('effort'),
        () => {
          effort.value = 'high';
        },
        hoverStep('web'),
        () => {
          webSearch.value = !webSearch.value;
        },
        hoverStep(next),
        () => {
          selected.value = next;
          thinking.value = false;
          closeMenu(false);
        },
        () => undefined,
      ];
    },
  });
</script>

<template>
  <div ref="rootRef" :class="cn('relative w-full max-w-lg', props.class)">
    <form
      class="rounded-2xl border border-border bg-card p-3.5 shadow-xs"
      @submit.prevent="onSubmit"
    >
      <input
        v-model="prompt"
        type="text"
        :placeholder="placeholder"
        aria-label="Prompt"
        class="w-full bg-transparent px-1.5 pt-1 pb-4 text-lg text-foreground outline-none placeholder:text-muted-foreground/70"
      />
      <div class="flex items-center justify-between gap-3">
        <div class="relative">
          <button
            ref="chipRef"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open"
            :aria-controls="menuId"
            :aria-label="`Model: ${chipName}`"
            class="flex h-10 items-center gap-2 rounded-lg bg-foreground/5 pr-2.5 pl-2 text-lg font-medium text-foreground outline-none transition-colors hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring/60"
            @click="onChipClick"
            @keydown="onChipKeydown"
          >
            <span
              class="flex size-6 items-center justify-center rounded-md border border-border bg-background text-xs"
              aria-hidden="true"
            >
              <Icon v-if="isAuto" name="lucide:sparkle" class="size-3" />
              <template v-else>{{ chipGlyph }}</template>
            </span>
            <span class="grid">
              <Transition name="mp-chip">
                <span :key="chipName" class="col-start-1 row-start-1">
                  {{ chipName }}
                </span>
              </Transition>
            </span>
            <Icon
              v-if="thinking"
              name="lucide:lightbulb"
              class="size-4"
              :style="{ color: accent }"
            />
            <Icon
              v-if="webSearch"
              name="lucide:globe"
              class="size-4"
              :style="{ color: accent }"
            />
            <Icon
              name="lucide:chevron-down"
              :class="[
                'size-4 text-muted-foreground transition-transform duration-200',
                open ? 'rotate-180' : '',
              ]"
            />
          </button>

          <AnimatePresence>
            <component
              :is="motion.div"
              v-if="open"
              :initial="menuMotion.initial"
              :animate="menuMotion.animate"
              :exit="menuMotion.exit"
              :transition="{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }"
              class="absolute top-full left-0 z-50 mt-2.5 w-120 max-w-[calc(100vw-3rem)] origin-top-left"
            >
              <div
                :id="menuId"
                ref="menuRef"
                role="menu"
                tabindex="-1"
                aria-label="Model"
                class="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/5 outline-none dark:shadow-black/40"
                @keydown="onMenuKeydown"
                @focusin="onFocusIn"
                @pointerleave="onMenuLeave"
              >
                <div class="p-1.5">
                  <div
                    class="flex items-center gap-3 px-2.5 pt-1.5 pb-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase"
                    aria-hidden="true"
                  >
                    <span class="flex-1">Model</span>
                    <span
                      class="grid grid-cols-3 gap-2.5 text-center max-sm:gap-1 *:w-15.5 max-sm:*:w-9.5"
                    >
                      <span v-for="column in COLUMNS" :key="column.label">
                        <span class="max-sm:hidden">{{ column.label }}</span>
                        <span class="sm:hidden">
                          <Icon :name="column.icon" class="size-3.5" />
                        </span>
                      </span>
                    </span>
                  </div>
                  <ModelPickerRow
                    v-for="model in models"
                    :key="model.id"
                    :item-key="model.id"
                    :name="model.name"
                    :tagline="model.tagline"
                    :glyph="model.glyph"
                    :icon="model.icon"
                    :speed="model.speed"
                    :quality="model.quality"
                    :cost="model.cost"
                    :checked="currentKey === model.id"
                    :active="activeKey === model.id"
                    :lit="(activeKey ?? currentKey) === model.id"
                    :dimmed="hoveringRow && activeKey !== model.id"
                    :accent="accent"
                    :animate="animate"
                    @select="onSelect"
                    @hover="onHover"
                  />
                  <ModelPickerRow
                    v-if="showAuto"
                    item-key="auto"
                    :name="autoLabel"
                    :tagline="autoTagline"
                    icon="lucide:sparkle"
                    varies
                    :checked="isAuto"
                    :active="activeKey === 'auto'"
                    :lit="false"
                    :dimmed="hoveringRow && activeKey !== 'auto'"
                    :accent="accent"
                    :animate="animate"
                    @select="onSelect"
                    @hover="onHover"
                  />
                </div>
                <div class="border-t border-border p-1.5">
                  <ModelPickerToggle
                    item-key="thinking"
                    label="Extended thinking"
                    icon="lucide:lightbulb"
                    :checked="thinking"
                    :active="activeKey === 'thinking'"
                    :accent="accent"
                    @toggle="onToggle"
                    @hover="onHover"
                  />
                  <div
                    :class="[
                      'grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none',
                      thinking
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    ]"
                    :inert="!thinking"
                  >
                    <div class="min-h-0 overflow-hidden">
                      <ModelPickerEffortControl
                        :effort="effort"
                        :active="activeKey === 'effort'"
                        label="Effort"
                        @change="onEffort"
                        @hover="onHover"
                      />
                    </div>
                  </div>
                  <ModelPickerToggle
                    item-key="web"
                    label="Web search"
                    icon="lucide:globe"
                    :checked="webSearch"
                    :active="activeKey === 'web'"
                    :accent="accent"
                    @toggle="onToggle"
                    @hover="onHover"
                  />
                </div>
                <ModelPickerTray
                  :latency="trayLatency"
                  :price="trayPrice"
                  :hint="trayHint"
                  :animate="animate"
                />
              </div>
            </component>
          </AnimatePresence>
        </div>
        <button
          type="submit"
          aria-label="Send"
          class="flex size-10 items-center justify-center rounded-lg bg-foreground text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Icon name="lucide:arrow-up" class="size-5" />
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
  .mp-chip-enter-active,
  .mp-chip-leave-active {
    transition:
      opacity 220ms ease,
      filter 220ms ease;
  }
  .mp-chip-enter-from,
  .mp-chip-leave-to {
    opacity: 0;
    filter: blur(4px);
  }
</style>
