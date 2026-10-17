import type { BranchedMenuItem } from './types';

export const DEFAULT_BRANCHED_MENU_ITEMS: BranchedMenuItem[] = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation', icon: 'lucide:download' },
      { value: 'quick', label: 'Quick start', icon: 'lucide:rocket' },
      { value: 'config', label: 'Configuration', icon: 'lucide:settings' },
      { value: 'theming', label: 'Theming', icon: 'lucide:palette' },
    ],
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons', icon: 'lucide:mouse-pointer-2' },
      { value: 'typography', label: 'Typography', icon: 'lucide:type' },
      { value: 'overlays', label: 'Overlays', icon: 'lucide:layers' },
      { value: 'toasts', label: 'Toasts', icon: 'lucide:bell' },
    ],
  },
];
