import type { EquipmentDevice, EquipmentTile } from './types';

export const GREEN = '#4ade80';
export const ORANGE = '#ff9a2e';
const BLUE = '#7aa2ff';

export const DEFAULT_TILES: EquipmentTile[] = [
  {
    key: 'battery',
    label: 'Battery',
    note: '17.3 kWh',
    value: 64,
    unit: '%',
    level: 0.64,
    color: GREEN,
  },
  {
    key: 'inverter',
    label: 'Inverter',
    note: 'of 7.6',
    value: 4.82,
    decimals: 2,
    unit: 'kW',
    level: 0.63,
    color: ORANGE,
  },
  {
    key: 'grid',
    label: 'Grid',
    note: 'exporting',
    value: 0.72,
    decimals: 2,
    unit: 'kW',
    level: 0.12,
    color: BLUE,
  },
];

export const DEFAULT_DEVICES: EquipmentDevice[] = [
  {
    id: 'battery-a',
    name: 'Battery A',
    detail: 'Garage wall · 13.5 kWh',
    status: 'ok',
    level: 0.7,
    levelColor: GREEN,
    power: 0.98,
    signed: true,
    temp: 24,
  },
  {
    id: 'battery-b',
    name: 'Battery B',
    detail: 'Garage wall · 13.5 kWh',
    status: 'ok',
    level: 0.6,
    levelColor: GREEN,
    power: 0.98,
    signed: true,
    temp: 25,
  },
  {
    id: 'inverter',
    name: 'Inverter',
    detail: 'Hybrid · 7.6 kW',
    status: 'warn',
    level: 0.8,
    levelColor: ORANGE,
    power: 4.82,
    temp: 41,
    action: 'Run check',
    chart: {
      label: 'Heatsink temp',
      points: [
        33.6, 33.4, 33.3, 33.5, 34.4, 35.6, 36.6, 37.6, 38.3, 38.6, 39.1, 39.2,
        38.9, 38.5, 38.7, 39.2,
      ],
      limit: 45,
      limitLabel: 'Limit 45 °C',
      note: 'Fan 70 %',
      min: 31,
    },
  },
  {
    id: 'solar',
    name: 'Solar array',
    detail: '2 strings · 18 panels',
    status: 'ok',
    level: 0.8,
    levelColor: ORANGE,
    power: 4.82,
    temp: null,
  },
  {
    id: 'ev',
    name: 'EV charger',
    detail: 'Driveway · starts 23:00',
    status: 'idle',
    level: 0,
    power: 0,
    temp: null,
  },
];

/**
 * Small deterministic wobble for the live mode. Returns a factor around 1.
 * `t` is the tick count, `seed` keeps each value out of step with the others.
 */
export function wobble(t: number, seed: number, amount: number): number {
  if (t === 0) return 1;
  return (
    1 +
    amount *
      (Math.sin(t * 0.83 + seed * 1.91) * 0.6 +
        Math.sin(t * 0.37 + seed * 0.7) * 0.4)
  );
}

/** Smooth SVG path through points with Catmull-Rom curves. */
export function smoothPath(points: [number, number][]): string {
  if (!points.length) return '';
  const f = (n: number): string => n.toFixed(1);
  const first = points[0];
  if (!first) return '';
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
