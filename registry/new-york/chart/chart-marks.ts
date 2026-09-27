// Dependency-free subset of the mark API exported by @tanstack/charts and
// @tanstack/charts/polar. Each builder evaluates its channels while the datum
// type is known and returns a render-ready mark; geometry is resolved later by
// the scene compiler at a concrete size.
import type {
  AreaYMark,
  AreaYOptions,
  CartesianPoint,
  Channel,
  ChartDefinition,
  ChartSpec,
  ChartValue,
  LineYMark,
  LineYOptions,
  PieDatum,
  PieOptions,
  PolarMark,
  PolarOptions,
  RadialArcMark,
  RadialArcOptions,
  TransformValue,
  VisualChannel,
} from './types';

const TAU = Math.PI * 2;

function read<TDatum, TValue>(
  datum: TDatum,
  index: number,
  data: readonly TDatum[],
  channel: Channel<TDatum, TValue> | TransformValue<TDatum, TValue> | undefined,
): unknown {
  if (channel === undefined) return undefined;
  if (typeof channel === 'function') return channel(datum, { index, data });
  return datum[channel];
}

function visual<TDatum>(
  data: readonly TDatum[],
  index: number,
  channel: VisualChannel<TDatum, string> | undefined,
): string | undefined {
  if (typeof channel !== 'function') return channel;
  const datum = data[index];
  return datum === undefined ? undefined : channel(datum, { index, data });
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isChartValue = (value: unknown): value is ChartValue =>
  isFiniteNumber(value) || typeof value === 'string' || value instanceof Date;

function points<TDatum>(
  data: readonly TDatum[],
  x: Channel<TDatum, ChartValue | null | undefined> | undefined,
  y: Channel<TDatum, number | null | undefined> | undefined,
  y1?: number | Channel<TDatum, number | null | undefined>,
): CartesianPoint[] {
  return data.flatMap((datum, index) => {
    // A missing position channel falls back to the datum index, as in TanStack.
    const xv = x === undefined ? index : read(datum, index, data, x);
    const yv = y === undefined ? index : read(datum, index, data, y);
    if (!isChartValue(xv) || !isFiniteNumber(yv)) return [];
    const base = typeof y1 === 'number' ? y1 : read(datum, index, data, y1);
    return [{ x: xv, y: yv, y1: isFiniteNumber(base) ? base : 0 }];
  });
}

export function defineChart(spec: ChartSpec): ChartDefinition {
  return { marks: spec.marks, scales: spec.scales };
}

export function lineY<TDatum>(
  source: Iterable<TDatum>,
  options: LineYOptions<NoInfer<TDatum>> = {},
): LineYMark {
  const data = Array.from(source);
  return {
    kind: 'lineY',
    id: options.id,
    points: points(data, options.x, options.y),
    stroke: visual(data, 0, options.stroke),
    strokeOpacity: options.strokeOpacity,
    strokeWidth: options.strokeWidth,
    strokeDasharray: options.strokeDasharray,
  };
}

export function areaY<TDatum>(
  source: Iterable<TDatum>,
  options: AreaYOptions<NoInfer<TDatum>> = {},
): AreaYMark {
  const data = Array.from(source);
  return {
    kind: 'areaY',
    id: options.id,
    points: points(data, options.x, options.y, options.y1),
    fill: visual(data, 0, options.fill),
    fillOpacity: options.fillOpacity,
    stroke: visual(data, 0, options.stroke),
    strokeWidth: options.strokeWidth,
  };
}

export function polar(options: PolarOptions): PolarMark {
  return { kind: 'polar', options };
}

export function radialArc<TDatum>(
  source: Iterable<TDatum>,
  options: RadialArcOptions<NoInfer<TDatum>> = {},
): RadialArcMark {
  const data = Array.from(source);
  const slices = data.flatMap((datum, index) => {
    const start = read(datum, index, data, options.startAngle);
    const end = read(datum, index, data, options.endAngle);
    const pad = read(datum, index, data, options.padAngle);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return [];
    return [
      {
        startAngle: start,
        endAngle: end,
        padAngle: isFiniteNumber(pad) ? pad : 0,
        fill: visual(data, index, options.fill),
        stroke: visual(data, index, options.stroke),
      },
    ];
  });
  return {
    kind: 'radialArc',
    id: options.id,
    className: options.className,
    slices,
    innerRadius: options.innerRadius,
    outerRadius: options.outerRadius,
    cornerRadius: options.cornerRadius,
    fillOpacity: options.fillOpacity,
    strokeOpacity: options.strokeOpacity,
    strokeWidth: options.strokeWidth,
    opacity: options.opacity,
  };
}

/**
 * Allocates nonnegative values into angular intervals, in input order.
 * Matches TanStack's allocation: gaps sit between positive slices, plus one
 * after the last slice when the sweep is a full revolution.
 */
export function pie<TDatum extends object>(
  source: Iterable<TDatum>,
  options: PieOptions<NoInfer<TDatum>>,
): PieDatum<TDatum>[] {
  const data = Array.from(source);
  const start = options.startAngle ?? 0;
  const end = options.endAngle ?? TAU;
  const gap = options.gapAngle ?? 0;
  const sweep = end - start;
  if (!Number.isFinite(sweep) || Math.abs(sweep) > TAU) {
    throw new TypeError('pie: angular sweep must be no greater than 2π');
  }

  const entries = data.flatMap((datum, index) => {
    const value = read(datum, index, data, options.value);
    if (!isFiniteNumber(value)) return [];
    if (value < 0) {
      throw new TypeError(`pie: value at index ${index} must be nonnegative`);
    }
    return [{ datum, index, value }];
  });

  const full = Math.abs(Math.abs(sweep) - TAU) <= 1e-12;
  const positive = entries.filter((entry) => entry.value > 0).length;
  const gapCount =
    positive === 0 ? 0 : Math.max(0, positive - 1) + (full ? 1 : 0);
  const drawable = Math.abs(sweep) - gapCount * gap;
  if (positive > 0 && drawable <= 0) {
    throw new TypeError('pie: gapAngle leaves insufficient angular space');
  }

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const direction = sweep < 0 ? -1 : 1;
  let cursor = start;
  let remaining = positive;

  return entries.map(({ datum, index, value }, order) => {
    const fraction = total === 0 ? 0 : value / total;
    const sliceStart = cursor;
    let sliceEnd = cursor;
    if (value > 0) {
      remaining -= 1;
      sliceEnd =
        remaining === 0
          ? end - (full ? direction * gap : 0)
          : cursor + direction * drawable * fraction;
      cursor = sliceEnd;
      if (remaining > 0 || full) cursor += direction * gap;
    }
    return {
      ...datum,
      source: [datum],
      sourceIndexes: [index],
      value,
      index: order,
      fraction,
      startAngle: sliceStart,
      endAngle: sliceEnd,
      angle: sliceStart + (sliceEnd - sliceStart) / 2,
      padAngle: 0,
    };
  });
}
