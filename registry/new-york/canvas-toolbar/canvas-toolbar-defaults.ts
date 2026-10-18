import type { CanvasMenuAction, CanvasTool, CanvasViewOption } from './types';

export const DEFAULT_CANVAS_TOOLS: CanvasTool[] = [
  { id: 'source', label: 'Data source', icon: 'lucide:box' },
  { id: 'select', label: 'Select', icon: 'lucide:navigation' },
  { id: 'note', label: 'Sticky note', icon: 'lucide:sticky-note' },
  { id: 'frame', label: 'Frame', icon: 'lucide:vector-square' },
];

export const DEFAULT_CANVAS_VIEWS: CanvasViewOption[] = [
  { id: 'chart', label: 'Chart', icon: 'lucide:chart-no-axes-column' },
  { id: 'table', label: 'Table', icon: 'lucide:table' },
  { id: 'number', label: 'Number', icon: 'lucide:hash' },
];

export const DEFAULT_CANVAS_ACTIONS: CanvasMenuAction[] = [
  { id: 'duplicate', label: 'Duplicate', icon: 'lucide:copy', shortcut: '⌘D' },
  { id: 'lock', label: 'Lock', icon: 'lucide:lock', shortcut: '⇧⌘L' },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'lucide:trash-2',
    shortcut: '⌫',
    destructive: true,
  },
];
