import type { PowerMonitorSeries } from './types';

/** Small seeded PRNG so sample data is the same on the server and client. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 1831565813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v: number, d = 2): number => Number(v.toFixed(d));
const pad = (n: number): string => String(n).padStart(2, '0');

/** Clear-sky curve between sunrise and sunset, 0..1. */
function sun(hour: number, rise = 6.6, set = 19.6): number {
  if (hour <= rise || hour >= set) return 0;
  return Math.sin((Math.PI * (hour - rise)) / (set - rise)) ** 1.25;
}

/** Typical home load for an hour of the day, in kW. */
function load(hour: number): number {
  const bump = (center: number, width: number, height: number): number =>
    height * Math.exp(-(((hour - center) / width) ** 2));
  return (
    0.32 + bump(7.6, 0.9, 1.1) + bump(12.6, 1, 0.55) + bump(19.5, 1.6, 1.4)
  );
}

/** Sample day: 20-minute columns with the cursor at 14:20. */
export function createPowerMonitorDaySeries(): PowerMonitorSeries {
  const rand = seeded(15);
  const solar: number[] = [];
  const home: number[] = [];
  const columnLabels: string[] = [];
  for (let i = 0; i < 72; i++) {
    const hour = i / 3;
    // A cloud bank in the morning, then a clear, bright afternoon.
    const cloud = hour > 9.4 && hour < 10.4 ? 0.7 : 1;
    const skew = hour < 14.3 ? 0.62 + 0.38 * ((hour - 6.6) / 7.7) : 1;
    solar.push(round(5.4 * sun(hour) * cloud * skew * (0.94 + rand() * 0.1)));
    home.push(round(load(hour) * (0.85 + rand() * 0.3)));
    columnLabels.push(`${pad(Math.floor(hour))}:${pad((i % 3) * 20)}`);
  }
  return {
    range: 'day',
    label: 'Day',
    date: 'Oct 15',
    unit: 'kW',
    solar,
    home,
    columnLabels,
    ticks: [0, 6, 12, 18, 24].map((h) => ({ at: h / 24, label: pad(h) })),
    now: 43,
    summary: [
      { label: 'Solar so far', value: '29.8 kWh', color: '' },
      { label: 'Home use', value: '11.8 kWh', color: '' },
      { label: 'Forecast to sunset', value: '+13.7 kWh', color: '', dim: true },
    ],
  };
}

function weekSeries(): PowerMonitorSeries {
  const rand = seeded(7);
  const days = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const sky = [0.72, 0.95, 0.9, 0.55, 0.82, 0.88, 1];
  const solar: number[] = [];
  const home: number[] = [];
  const columnLabels: string[] = [];
  days.forEach((day, d) => {
    for (let b = 0; b < 8; b++) {
      const hour = b * 3 + 1.5;
      solar.push(round(4.8 * sun(hour) * (sky[d] ?? 1) * (0.9 + rand() * 0.2)));
      home.push(round(load(hour) * (0.85 + rand() * 0.3)));
      columnLabels.push(`${day} ${pad(b * 3)}:00`);
    }
  });
  return {
    range: 'week',
    label: 'Week',
    date: 'Oct 9 – 15',
    unit: 'kW',
    solar,
    home,
    columnLabels,
    ticks: days.map((day, d) => ({ at: (d + 0.5) / 7, label: day.charAt(0) })),
    now: 52,
    summary: [
      { label: 'Solar this week', value: '214 kWh', color: '' },
      { label: 'Home use', value: '86.4 kWh', color: '' },
      { label: 'Forecast to sunset', value: '+13.7 kWh', color: '', dim: true },
    ],
  };
}

function monthSeries(): PowerMonitorSeries {
  const rand = seeded(10);
  const solar: number[] = [];
  const home: number[] = [];
  const columnLabels: string[] = [];
  for (let day = 1; day <= 30; day++) {
    const cloudy = rand() < 0.22;
    const value = (cloudy ? 14 : 30) + rand() * 12;
    const use = 10 + rand() * 6;
    for (let half = 0; half < 2; half++) {
      solar.push(round(value * (0.96 + half * 0.04), 1));
      home.push(round(use, 1));
      columnLabels.push(`Oct ${day}`);
    }
  }
  return {
    range: 'month',
    label: 'Month',
    date: 'October',
    unit: 'kWh',
    solar,
    home,
    columnLabels,
    ticks: [1, 8, 15, 22, 30].map((d) => ({
      at: (d - 0.5) / 30,
      label: String(d),
    })),
    now: 29,
    summary: [
      { label: 'Solar this month', value: '498 kWh', color: '' },
      { label: 'Home use', value: '192 kWh', color: '' },
      {
        label: 'Forecast to month end',
        value: '+472 kWh',
        color: '',
        dim: true,
      },
    ],
  };
}

function yearSeries(): PowerMonitorSeries {
  const rand = seeded(26);
  const months = 'JFMAMJJASOND'.split('');
  const names = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const solar: number[] = [];
  const home: number[] = [];
  const columnLabels: string[] = [];
  names.forEach((name, m) => {
    const season = 0.45 + 0.55 * Math.sin((Math.PI * (m + 0.5)) / 12);
    for (let b = 0; b < 5; b++) {
      solar.push(Math.round(1050 * season * (0.92 + rand() * 0.12)));
      home.push(Math.round(330 + (m < 2 || m > 9 ? 90 : 20) + rand() * 40));
      columnLabels.push(name);
    }
  });
  return {
    range: 'year',
    label: 'Year',
    date: '2026',
    unit: 'kWh',
    solar,
    home,
    columnLabels,
    ticks: months.map((label, m) => ({ at: (m + 0.5) / 12, label })),
    now: 47,
    summary: [
      { label: 'Solar this year', value: '7.9 MWh', color: '' },
      { label: 'Home use', value: '3.4 MWh', color: '' },
      {
        label: 'Forecast to year end',
        value: '+1.1 MWh',
        color: '',
        dim: true,
      },
    ],
  };
}

/** Sample series for every range, generated deterministically. */
export function createPowerMonitorSeries(): PowerMonitorSeries[] {
  return [
    createPowerMonitorDaySeries(),
    weekSeries(),
    monthSeries(),
    yearSeries(),
  ];
}

/** Two decimals under 10, one under 100, whole numbers above. */
export function formatReading(value: number): string {
  if (value < 10) return value.toFixed(2);
  if (value < 100) return value.toFixed(1);
  return String(Math.round(value));
}

/**
 * Builds one SVG path out of many square cells, so the whole pixel grid
 * renders as a handful of elements.
 */
export function cellPath(
  cells: ReadonlyArray<readonly [number, number]>,
  size: number,
): string {
  let d = '';
  for (const [x, y] of cells) {
    d += `M${x.toFixed(2)} ${y.toFixed(2)}h${size}v${size}h-${size}z`;
  }
  return d;
}
