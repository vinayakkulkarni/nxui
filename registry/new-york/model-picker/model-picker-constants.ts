import type {
  ModelPickerColumn,
  ModelPickerEffortLevel,
  ModelPickerEffortScale,
  ModelPickerHints,
} from './types';

export const AUTO_KEY = 'auto';

export const EFFORTS: readonly ModelPickerEffortLevel[] = [
  'low',
  'medium',
  'high',
];

export const DEFAULT_EFFORT_SCALE: ModelPickerEffortScale = {
  low: 1.8,
  medium: 2.6,
  high: 4,
};

export const DEFAULT_HINTS: ModelPickerHints = {
  auto: 'Picks per message',
  thinkingOn: 'Thinks it through before it answers',
  thinkingOff: 'Answers right away',
  webOn: 'Looks things up on the web when it helps',
  webOff: 'Answers from what it already knows',
};

export const COLUMNS: readonly ModelPickerColumn[] = [
  { label: 'Speed', icon: 'lucide:zap' },
  { label: 'Quality', icon: 'lucide:sparkles' },
  { label: 'Cost', icon: 'lucide:coins' },
];
