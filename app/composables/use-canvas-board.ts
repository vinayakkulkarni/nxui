import type {
  CanvasMenuAction,
  CanvasViewOption,
} from '@registry/new-york/canvas-toolbar/types';
import type {
  NodeCanvasEdge,
  NodeCanvasNode,
  NodeCanvasPoint,
  NodeCanvasRect,
} from '@registry/new-york/node-canvas/types';
import type {
  DemoCanvasBoardOptions,
  DemoCanvasKind,
  DemoCanvasView,
} from '~/types/components';

type PlaceKind = 'source' | 'note' | 'frame';

const VIEW_OPTIONS: CanvasViewOption[] = [
  { id: 'chart', label: 'Chart', icon: 'lucide:chart-no-axes-column' },
  { id: 'table', label: 'Table', icon: 'lucide:table' },
  { id: 'number', label: 'Number', icon: 'lucide:hash' },
];
const NO_VIEWS: CanvasViewOption[] = [];

const TEMPLATES: Record<PlaceKind, Omit<NodeCanvasNode, 'id' | 'x' | 'y'>> = {
  source: {
    label: 'Data source',
    width: 220,
    height: 50,
    radius: 16,
    minimapColor: '#3b82f6',
  },
  note: {
    label: 'Sticky note',
    width: 182,
    height: 96,
    rotate: -2,
    radius: 12,
    minimapColor: '#f5d03b',
  },
  frame: { label: 'Frame', width: 280, height: 180, radius: 20 },
};

function isPlaceKind(value: string): value is PlaceKind {
  return value === 'source' || value === 'note' || value === 'frame';
}

function isView(value: string): value is DemoCanvasView {
  return value === 'chart' || value === 'table' || value === 'number';
}

// State and actions for the canvas demos: the tool switcher places nodes on
// click, and the selection toolbar switches views, duplicates, locks, deletes
// and expands the selected node. Shared by the node-canvas and canvas-toolbar
// demos so both behave the same.
export function useCanvasBoard(options: DemoCanvasBoardOptions) {
  const graph = ref<NodeCanvasNode[]>(options.nodes);
  const links = ref<NodeCanvasEdge[]>(options.edges ?? []);
  const kinds = ref<Record<string, DemoCanvasKind>>(options.kinds);
  const notes = ref<Record<string, string>>(options.notes ?? {});
  const views = ref<Record<string, DemoCanvasView>>(options.views ?? {});
  const tool = ref('select');
  const selected = ref<string | null>(options.selected ?? null);
  const expanded = ref<string | null>(null);
  let counter = 0;

  const selectedNode = computed(() =>
    graph.value.find((node) => node.id === selected.value),
  );

  const isCard = computed(() => {
    const kind = selected.value ? kinds.value[selected.value] : undefined;
    return kind === 'stops' || kind === 'downtime';
  });

  const selectionViews = computed(() =>
    isCard.value ? VIEW_OPTIONS : NO_VIEWS,
  );

  const selectionView = computed<string>({
    get: () => (selected.value ? views.value[selected.value] : '') ?? '',
    set: (value) => {
      const id = selected.value;
      if (id && isView(value)) views.value = { ...views.value, [id]: value };
    },
  });

  const actions = computed<CanvasMenuAction[]>(() => [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'lucide:copy',
      shortcut: '⌘D',
    },
    selectedNode.value?.locked
      ? {
          id: 'lock',
          label: 'Unlock',
          icon: 'lucide:lock-open',
          shortcut: '⇧⌘L',
        }
      : { id: 'lock', label: 'Lock', icon: 'lucide:lock', shortcut: '⇧⌘L' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'lucide:trash-2',
      shortcut: '⌫',
      destructive: true,
    },
  ]);

  const expandedNode = computed(() =>
    graph.value.find((node) => node.id === expanded.value),
  );

  function nextId(prefix: string): string {
    counter += 1;
    return `${prefix}-${counter}`;
  }

  function patch(id: string, next: Partial<NodeCanvasNode>): void {
    graph.value = graph.value.map((node) =>
      node.id === id ? { ...node, ...next } : node,
    );
  }

  /** The source, note and frame tools place a node where you click. */
  function onCanvasClick(point: NodeCanvasPoint): void {
    const kind = tool.value;
    if (!isPlaceKind(kind)) return;
    const template = TEMPLATES[kind];
    const id = nextId(kind);
    graph.value = [
      ...graph.value,
      {
        ...template,
        id,
        x: Math.round(point.x - template.width / 2),
        y: Math.round(point.y - template.height / 2),
      },
    ];
    kinds.value = { ...kinds.value, [id]: kind };
    if (kind === 'note') notes.value = { ...notes.value, [id]: '' };
    selected.value = id;
    tool.value = 'select';
  }

  function onNodeMove(id: string, position: NodeCanvasPoint): void {
    patch(id, position);
  }

  function onNodeResize(id: string, rect: NodeCanvasRect): void {
    patch(id, rect);
  }

  function removeNode(id: string): void {
    graph.value = graph.value.filter((node) => node.id !== id);
    links.value = links.value.filter(
      (edge) => edge.from !== id && edge.to !== id,
    );
    if (selected.value === id) selected.value = null;
    if (expanded.value === id) expanded.value = null;
  }

  function duplicateNode(id: string): void {
    const node = graph.value.find((item) => item.id === id);
    const kind = kinds.value[id];
    if (!node || !kind) return;
    const copy = nextId(kind);
    graph.value = [
      ...graph.value,
      { ...node, id: copy, x: node.x + 32, y: node.y + 32, locked: false },
    ];
    kinds.value = { ...kinds.value, [copy]: kind };
    const note = notes.value[id];
    if (note !== undefined) notes.value = { ...notes.value, [copy]: note };
    const view = views.value[id];
    if (view) views.value = { ...views.value, [copy]: view };
    selected.value = copy;
  }

  function onAction(action: string): void {
    const id = selected.value;
    if (!id) return;
    if (action === 'duplicate') duplicateNode(id);
    else if (action === 'lock')
      patch(id, { locked: !selectedNode.value?.locked });
    else if (action === 'delete') removeNode(id);
  }

  function onExpand(): void {
    expanded.value = selected.value;
  }

  function closeExpanded(): void {
    expanded.value = null;
  }

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && expanded.value) closeExpanded();
  });

  function viewOf(id: string): DemoCanvasView {
    return views.value[id] ?? 'chart';
  }

  return {
    graph,
    links,
    kinds,
    notes,
    tool,
    selected,
    expanded,
    expandedNode,
    selectionViews,
    selectionView,
    actions,
    viewOf,
    onCanvasClick,
    onNodeMove,
    onNodeResize,
    removeNode,
    onAction,
    onExpand,
    closeExpanded,
  };
}
