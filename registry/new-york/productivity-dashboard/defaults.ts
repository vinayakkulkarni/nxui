import type {
  ProductivityRange,
  ProductivitySession,
  ProductivitySleep,
  ProductivitySound,
} from './types';

export const DEFAULT_RANGES: ProductivityRange[] = [
  {
    value: 'today',
    label: 'Today',
    average: 78,
    caption: 'Average today',
    delta: '+6% vs yesterday',
    trend: 'up',
    bars: [
      { label: '6a', value: 24 },
      { label: '9a', value: 46 },
      { label: '12p', value: 80 },
      { label: '3p', value: 94 },
      { label: '6p', value: 68 },
      { label: '9p', value: 52 },
      { label: '12a', value: 30 },
    ],
  },
  {
    value: 'week',
    label: 'Week',
    average: 64,
    caption: 'Average this week',
    delta: '−3% vs last week',
    trend: 'down',
    bars: [
      { label: 'M', value: 60 },
      { label: 'T', value: 72 },
      { label: 'W', value: 50 },
      { label: 'T', value: 84 },
      { label: 'F', value: 66 },
      { label: 'S', value: 38 },
      { label: 'S', value: 56 },
    ],
  },
  {
    value: 'month',
    label: 'Month',
    average: 71,
    caption: 'Average this month',
    delta: '+2% vs last month',
    trend: 'up',
    bars: [
      { label: '1', value: 58 },
      { label: '5', value: 66 },
      { label: '10', value: 88 },
      { label: '15', value: 70 },
      { label: '20', value: 62 },
      { label: '25', value: 76 },
      { label: '30', value: 54 },
    ],
  },
];

export const DEFAULT_SLEEP: ProductivitySleep = {
  duration: '7h 42m',
  summary: 'Score 86 · Restful',
  period: '23:40 — 07:22 · Score 86',
  columns: [0, 2, 4, 3, 4, 2, 3, 1, 2, 0, 0, 0],
  stats: [
    { label: 'Deep', value: '1h 48m' },
    { label: 'REM', value: '2h 06m' },
    { label: 'Awake', value: '12m' },
  ],
  steps: [
    { stage: 3, minutes: 14 },
    { stage: 1, minutes: 34 },
    { stage: 0, minutes: 46 },
    { stage: 1, minutes: 33 },
    { stage: 2, minutes: 28 },
    { stage: 1, minutes: 32 },
    { stage: 0, minutes: 37 },
    { stage: 1, minutes: 32 },
    { stage: 2, minutes: 37 },
    { stage: 1, minutes: 32 },
    { stage: 0, minutes: 18 },
    { stage: 1, minutes: 28 },
    { stage: 2, minutes: 37 },
    { stage: 1, minutes: 18 },
    { stage: 3, minutes: 9 },
    { stage: 2, minutes: 18 },
    { stage: 3, minutes: 9 },
  ],
  ticks: [
    { at: 0, label: '23:40' },
    { at: 110, label: '01:30' },
    { at: 230, label: '03:30' },
    { at: 350, label: '05:30' },
    { at: 462, label: '07:22' },
  ],
  insight: 'You fell asleep 14 min faster than your weekly average.',
};

export const DEFAULT_SESSIONS: ProductivitySession[] = [
  { id: 'pomodoro', label: 'Pomodoro', minutes: 25, icon: 'timer' },
  { id: 'deep-work', label: 'Deep work', minutes: 45, icon: 'target' },
  { id: 'short-break', label: 'Short break', minutes: 5, icon: 'coffee' },
];

export const DEFAULT_SOUND: ProductivitySound = {
  title: 'Rain on glass',
  subtitle: 'Ambient · pairs with Focus',
};
