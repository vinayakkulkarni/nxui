import type {
  PromptBarCommand,
  PromptBarModel,
  PromptBarSource,
  PromptBarToken,
} from './types';

export const ARROW_UP = [
  12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11,
];
export const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
export const EASE_IN_OUT: [number, number, number, number] = [
  0.77, 0, 0.175, 1,
];
export const LINE = 22;
export const EDGE = 11;

export const DEFAULT_SOURCES: PromptBarSource[] = [
  {
    key: 'files',
    name: 'Photos & files',
    description: 'Upload from this device',
    icon: 'lucide:paperclip',
    attach: true,
  },
  {
    key: 'web',
    name: 'Web search',
    description: 'Live results',
    icon: 'lucide:globe',
  },
  {
    key: 'sales',
    name: 'Sales data',
    description: 'Revenue and churn',
    icon: 'lucide:chart-line',
  },
  {
    key: 'docs',
    name: 'Documents',
    description: 'Specs, notes, briefs',
    icon: 'lucide:file-text',
  },
  {
    key: 'mail',
    name: 'Mail',
    description: 'Read and draft mail',
    icon: 'lucide:mail',
  },
  {
    key: 'calendar',
    name: 'Calendar',
    description: 'Events and availability',
    icon: 'lucide:calendar',
  },
];

export const DEFAULT_COMMANDS: PromptBarCommand[] = [
  {
    key: 'summarize',
    name: '/summarize',
    description: 'Digest the thread so far',
  },
  {
    key: 'compare',
    name: '/compare',
    description: 'Two options side by side',
  },
  { key: 'draft', name: '/draft', description: 'Write a first version' },
  {
    key: 'explain',
    name: '/explain',
    description: 'A plain-language walkthrough',
  },
  { key: 'tasks', name: '/tasks', description: 'Turn this into a to-do list' },
];

export const DEFAULT_MODELS: PromptBarModel[] = [
  { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
  { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' },
  { key: 'nova-2', name: 'Nova 2', tag: 'Legacy' },
];

export const DEFAULT_EFFORTS = ['Low', 'Medium', 'High', 'Extra', 'Max'];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function pathAt(a: number[], b: number[], t: number): string {
  let d = '';
  for (let i = 0; i < a.length; i += 2) {
    const x = mix(a[i]!, b[i]!, t).toFixed(2);
    const y = mix(a[i + 1]!, b[i + 1]!, t).toFixed(2);
    d += `${i ? 'L' : 'M'}${x} ${y}`;
  }
  return `${d}Z`;
}

export function parseToken(draft: string): PromptBarToken | null {
  const m = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!m) return null;
  return {
    kind: m[2] === '@' ? 'at' : 'slash',
    query: (m[3] ?? '').toLowerCase(),
    start: m.index + (m[1] ?? '').length,
  };
}
