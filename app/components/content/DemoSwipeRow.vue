<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from 'vue';
  import SwipeRow from '@registry/new-york/swipe-row/SwipeRow.vue';
  import type {
    SwipeAction,
    SwipeRowDirection,
  } from '@registry/new-york/swipe-row/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_ROW = '#27272a';
  const DEFAULT_TEXT = '#f5f5f5';
  const DEFAULT_DRAWER = '#3f3f46';
  const DEFAULT_DIRECTION: SwipeRowDirection = 'left';
  const RETURN_MS = 1200;
  const GAP = 8;

  const ACTION_SETS: Record<string, SwipeAction[]> = {
    one: [{ id: 'delete', label: 'Delete', icon: 'lucide:trash-2' }],
    two: [
      { id: 'delete', label: 'Delete', icon: 'lucide:trash-2' },
      {
        id: 'archive',
        label: 'Archive',
        icon: 'lucide:archive',
        dismiss: true,
      },
    ],
    three: [
      { id: 'delete', label: 'Delete', icon: 'lucide:trash-2' },
      {
        id: 'archive',
        label: 'Archive',
        icon: 'lucide:archive',
        dismiss: true,
      },
      { id: 'flag', label: 'Flag', icon: 'lucide:flag' },
    ],
  };

  const ROWS = [
    {
      id: 'notes',
      icon: 'lucide:notebook-pen',
      title: 'Design review notes',
      subtitle: 'Edited 2 min ago',
      meta: '9:41',
    },
    {
      id: 'flight',
      icon: 'lucide:plane-takeoff',
      title: 'Flight to Lisbon',
      subtitle: 'Gate changes to B12',
      meta: 'Tue',
    },
    {
      id: 'invoice',
      icon: 'lucide:receipt-text',
      title: 'Invoice #1042',
      subtitle: 'Due in 3 days',
      meta: '$1,280',
    },
  ];

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    drawer: 'two',
    actionColor: '#e5484d',
    drawerColor: DEFAULT_DRAWER,
    rowColor: DEFAULT_ROW,
    textColor: DEFAULT_TEXT,
    height: 64,
    radius: 16,
    actionWidth: 80,
    direction: DEFAULT_DIRECTION,
    snapBounce: 0.2,
    resistance: 0.55,
    collapseMs: 200,
    commitAt: 0.6,
    fullSwipe: true,
    disabled: false,
  });

  const rowColor = computed(() =>
    !isDark.value && params.rowColor === DEFAULT_ROW
      ? '#f6f6f6'
      : params.rowColor,
  );
  const textColor = computed(() =>
    !isDark.value && params.textColor === DEFAULT_TEXT
      ? '#18181b'
      : params.textColor,
  );
  const drawerColor = computed(() =>
    !isDark.value && params.drawerColor === DEFAULT_DRAWER
      ? '#e4e4e7'
      : params.drawerColor,
  );
  const actions = computed(
    () => ACTION_SETS[params.drawer] ?? ACTION_SETS.two!,
  );

  const rows = ref(ROWS.slice());
  const openId = ref<string | null>(null);
  const timers: Array<ReturnType<typeof setTimeout>> = [];

  function setOpen(id: string, open: boolean) {
    if (open) openId.value = id;
    else if (openId.value === id) openId.value = null;
  }

  function remove(id: string) {
    const index = rows.value.findIndex((r) => r.id === id);
    rows.value = rows.value.filter((r) => r.id !== id);
    if (openId.value === id) openId.value = null;
    timers.push(
      setTimeout(() => {
        const original = ROWS.find((r) => r.id === id);
        if (!original) return;
        const next = rows.value.filter((r) => r.id !== id);
        next.splice(Math.min(Math.max(0, index), next.length), 0, original);
        rows.value = next;
      }, RETURN_MS),
    );
  }

  function onEnter(el: Element, done: () => void) {
    if (!(el instanceof HTMLElement)) return done();
    el.style.height = '0px';
    el.style.opacity = '0';
    el.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      el.style.transition =
        'height 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease';
      el.style.height = `${params.height + GAP}px`;
      el.style.opacity = '1';
    });
    el.addEventListener('transitionend', function finish(e: TransitionEvent) {
      if (e.propertyName !== 'height') return;
      el.removeEventListener('transitionend', finish);
      el.style.cssText = '';
      done();
    });
  }

  onBeforeUnmount(() => timers.forEach(clearTimeout));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'drawer', {
      options: {
        Delete: 'one',
        'Archive, Delete': 'two',
        'Flag, Archive, Delete': 'three',
      },
    });
    pane.addBinding(params, 'actionColor', { label: 'action' });
    pane.addBinding(params, 'drawerColor', { label: 'drawer color' });
    pane.addBinding(params, 'rowColor', { label: 'row' });
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'height', { min: 48, max: 88, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'actionWidth', { min: 56, max: 120, step: 4 });
    pane.addBinding(params, 'direction', {
      label: 'swipe',
      options: { Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'snapBounce', {
      label: 'flick bounce',
      min: 0,
      max: 0.3,
      step: 0.02,
    });
    pane.addBinding(params, 'resistance', { min: 0.4, max: 1, step: 0.05 });
    pane.addBinding(params, 'collapseMs', {
      label: 'collapse',
      min: 100,
      max: 400,
      step: 20,
    });
    pane.addBinding(params, 'commitAt', { min: 0.4, max: 0.9, step: 0.05 });
    pane.addBinding(params, 'fullSwipe');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import SwipeRow from '~/components/ui/swipe-row/SwipeRow.vue';
  import type { SwipeAction } from '~/components/ui/swipe-row/types';

  const actions: SwipeAction[] = [
    { id: 'delete', label: 'Delete', icon: 'lucide:trash-2' },
    { id: 'archive', label: 'Archive', icon: 'lucide:archive', dismiss: true },
  ];
  const visible = ref(true);
</script>

<template>
  <SwipeRow
    v-if=&quot;visible&quot;
    label=&quot;Design review notes&quot;
    :actions=&quot;actions&quot;
    action-color=&quot;#e5484d&quot;
    :action-width=&quot;80&quot;
    :commit-at=&quot;0.6&quot;
    @commit=&quot;visible = false&quot;
  >
    <Icon name=&quot;lucide:notebook-pen&quot; class=&quot;size-5 opacity-60&quot; />
    <span class=&quot;flex-1 text-sm font-medium&quot;>Design review notes</span>
    <span class=&quot;text-xs opacity-50&quot;>9:41</span>
  </SwipeRow>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <div class="w-full max-w-90">
        <TransitionGroup :css="false" @enter="onEnter">
          <div v-for="row in rows" :key="row.id">
            <SwipeRow
              class="mb-2"
              :label="row.title"
              :actions="actions"
              :open="openId === row.id"
              :action-color="params.actionColor"
              :drawer-color="drawerColor"
              :row-color="rowColor"
              :text-color="textColor"
              :height="params.height"
              :radius="params.radius"
              :action-width="params.actionWidth"
              :direction="params.direction"
              :snap-bounce="params.snapBounce"
              :resistance="params.resistance"
              :collapse-ms="params.collapseMs"
              :commit-at="params.commitAt"
              :full-swipe="params.fullSwipe"
              :disabled="params.disabled"
              @update:open="setOpen(row.id, $event)"
              @commit="remove(row.id)"
            >
              <Icon :name="row.icon" class="shrink-0 text-xl opacity-60" />
              <span class="grid min-w-0 flex-1 gap-0.5">
                <span class="truncate text-sm/tight font-medium">{{
                  row.title
                }}</span>
                <span class="truncate text-xs/tight opacity-60">{{
                  row.subtitle
                }}</span>
              </span>
              <span class="shrink-0 text-xs opacity-50">{{ row.meta }}</span>
            </SwipeRow>
          </div>
        </TransitionGroup>
      </div>
      <ShaderPane title="Swipe Row" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
