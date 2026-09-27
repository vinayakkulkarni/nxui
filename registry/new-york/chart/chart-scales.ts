// Dependency-free subset of the scales exported by
// @tanstack/charts/scales/linear and @tanstack/charts/scales/point.
// Tick and nice semantics follow d3-scale, which TanStack Charts uses.
import type { LinearScale, PointScale } from './types';

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

function tickIncrement(start: number, stop: number, count: number): number {
  const step = (stop - start) / Math.max(0, count);
  const power = Math.floor(Math.log10(step));
  const error = step / 10 ** power;
  const factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  return power >= 0 ? factor * 10 ** power : -(10 ** -power) / factor;
}

function linearTicks(start: number, stop: number, count: number): number[] {
  if (!(count > 0) || start === stop) return [start];
  const reverse = stop < start;
  const [lo, hi] = reverse ? [stop, start] : [start, stop];
  const inc = tickIncrement(lo, hi, count);
  if (inc === 0 || !Number.isFinite(inc)) return [];
  const ticks: number[] = [];
  if (inc > 0) {
    const i0 = Math.ceil(lo / inc);
    const i1 = Math.floor(hi / inc);
    for (let i = i0; i <= i1; i++) ticks.push(i * inc);
  } else {
    const i0 = Math.ceil(lo * -inc);
    const i1 = Math.floor(hi * -inc);
    for (let i = i0; i <= i1; i++) ticks.push(i / -inc);
  }
  return reverse ? ticks.reverse() : ticks;
}

function toPair(values: Iterable<number>): [number, number] {
  const [a = 0, b = 1] = Array.from(values);
  return [a, b];
}

function createLinear(
  initialDomain: [number, number],
  initialRange: [number, number],
): LinearScale {
  let domain = initialDomain;
  let range = initialRange;
  let clamped = false;

  const scale = ((value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return undefined;
    const [d0, d1] = domain;
    const span = d1 - d0;
    let t = span === 0 ? 0.5 : (value - d0) / span;
    if (clamped) t = Math.min(1, Math.max(0, t));
    return range[0] + t * (range[1] - range[0]);
  }) as LinearScale;

  function domainAccessor(): [number, number];
  function domainAccessor(values: Iterable<number>): LinearScale;
  function domainAccessor(values?: Iterable<number>) {
    if (values === undefined) return [...domain] as [number, number];
    domain = toPair(values);
    return scale;
  }
  function rangeAccessor(): [number, number];
  function rangeAccessor(values: Iterable<number>): LinearScale;
  function rangeAccessor(values?: Iterable<number>) {
    if (values === undefined) return [...range] as [number, number];
    range = toPair(values);
    return scale;
  }
  function clampAccessor(): boolean;
  function clampAccessor(value: boolean): LinearScale;
  function clampAccessor(value?: boolean) {
    if (value === undefined) return clamped;
    clamped = value;
    return scale;
  }

  scale.domain = domainAccessor;
  scale.range = rangeAccessor;
  scale.clamp = clampAccessor;
  scale.invert = (value) => {
    const span = range[1] - range[0];
    const t = span === 0 ? 0.5 : (value - range[0]) / span;
    return domain[0] + t * (domain[1] - domain[0]);
  };
  scale.ticks = (count = 10) => linearTicks(domain[0], domain[1], count);
  scale.tickFormat = (count = 10) => {
    const step = Math.abs(tickIncrement(domain[0], domain[1], count));
    const digits = step > 0 && step < 1 ? Math.ceil(-Math.log10(step)) : 0;
    return (value) => value.toFixed(Math.min(20, Math.max(0, digits)));
  };
  scale.nice = (count = 10) => {
    let [d0, d1] = domain;
    const reverse = d1 < d0;
    if (reverse) [d0, d1] = [d1, d0];
    for (let pass = 0; pass < 10; pass++) {
      const step = tickIncrement(d0, d1, count);
      if (!Number.isFinite(step) || step === 0) break;
      const next: [number, number] =
        step > 0
          ? [Math.floor(d0 / step) * step, Math.ceil(d1 / step) * step]
          : [Math.ceil(d0 * step) / step, Math.floor(d1 * step) / step];
      if (next[0] === d0 && next[1] === d1) break;
      [d0, d1] = next;
    }
    domain = reverse ? [d1, d0] : [d0, d1];
    return scale;
  };
  scale.copy = () => createLinear([...domain], [...range]).clamp(clamped);
  return scale;
}

/**
 * `scaleLinear()`, `scaleLinear(range)` or `scaleLinear(domain, range)`, as in
 * d3-scale: with one argument it is the range.
 */
export function scaleLinear(
  domainOrRange?: Iterable<number>,
  range?: Iterable<number>,
): LinearScale {
  if (domainOrRange === undefined) return createLinear([0, 1], [0, 1]);
  if (range === undefined) return createLinear([0, 1], toPair(domainOrRange));
  return createLinear(toPair(domainOrRange), toPair(range));
}

function createPoint<TDomain extends string | number>(
  initialDomain: TDomain[],
  initialRange: [number, number],
): PointScale<TDomain> {
  let domain = initialDomain;
  let range = initialRange;
  let pad = 0;

  const step = () => {
    const n = domain.length;
    const span = range[1] - range[0];
    return n <= 1 ? 0 : span / Math.max(1, n - 1 + pad * 2);
  };

  const scale = ((value: TDomain | null | undefined) => {
    if (value == null) return undefined;
    const index = domain.indexOf(value);
    if (index < 0) return undefined;
    if (domain.length === 1) return (range[0] + range[1]) / 2;
    return range[0] + step() * (pad + index);
  }) as PointScale<TDomain>;

  function domainAccessor(): TDomain[];
  function domainAccessor(values: Iterable<TDomain>): PointScale<TDomain>;
  function domainAccessor(values?: Iterable<TDomain>) {
    if (values === undefined) return [...domain];
    domain = Array.from(new Set(values));
    return scale;
  }
  function rangeAccessor(): [number, number];
  function rangeAccessor(values: Iterable<number>): PointScale<TDomain>;
  function rangeAccessor(values?: Iterable<number>) {
    if (values === undefined) return [...range] as [number, number];
    range = toPair(values);
    return scale;
  }
  function paddingAccessor(): number;
  function paddingAccessor(value: number): PointScale<TDomain>;
  function paddingAccessor(value?: number) {
    if (value === undefined) return pad;
    pad = value;
    return scale;
  }

  scale.domain = domainAccessor;
  scale.range = rangeAccessor;
  scale.padding = paddingAccessor;
  scale.step = step;
  scale.copy = () => createPoint([...domain], [...range]).padding(pad);
  return scale;
}

/**
 * `scalePoint()`, `scalePoint(range)` or `scalePoint(domain, range)`, as in
 * d3-scale: with one argument it is the range.
 */
export function scalePoint<TDomain extends string | number = string>(
  domainOrRange?: Iterable<TDomain | number>,
  range?: Iterable<number>,
): PointScale<TDomain> {
  if (domainOrRange === undefined) return createPoint<TDomain>([], [0, 1]);
  const values: (TDomain | number)[] = Array.from(domainOrRange);
  if (range === undefined) {
    return createPoint<TDomain>([], toPair(values.filter(isNumber)));
  }
  const domain = values.filter((value): value is TDomain =>
    isDomainValue<TDomain>(value),
  );
  return createPoint<TDomain>(Array.from(new Set(domain)), toPair(range));
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isDomainValue<TDomain extends string | number>(
  value: unknown,
): value is TDomain {
  return typeof value === 'string' || typeof value === 'number';
}
