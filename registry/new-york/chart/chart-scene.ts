// Compiles a chart definition at a concrete size into renderer-neutral SVG
// primitives. Geometry follows TanStack Charts conventions: polar angle 0 is
// 12 o'clock and increases clockwise; arc corners follow d3-shape's arc.
import type {
  AreaYMark,
  ChartDefinition,
  ChartPositionScaleOptions,
  ChartScaleInstance,
  ChartScene,
  ChartValue,
  LineYMark,
  PointScale,
  PolarLayoutContext,
  PolarLength,
  PolarMark,
  RadialArcMark,
  SceneGridLine,
  ScenePath,
  SceneTick,
} from './types';

const TAU = Math.PI * 2;
const EPSILON = 1e-9;

const round = (n: number) => Math.round(n * 1000) / 1000;
const pt = (x: number, y: number) => `${round(x)},${round(y)}`;

function isPointScale(
  scale: ChartScaleInstance,
): scale is PointScale<string | number> {
  return 'padding' in scale;
}

function instantiate(options: ChartPositionScaleOptions): {
  scale: ChartScaleInstance;
  inferred: boolean;
} {
  const input = options.scale;
  if ('domain' in input) return { scale: input.copy(), inferred: false };
  return { scale: input(), inferred: true };
}

function numeric(value: ChartValue): number {
  return value instanceof Date ? value.getTime() : Number(value);
}

function estimateLabelWidth(text: string): number {
  return text.length * 6.4 + 10;
}

function compileCartesian(
  definition: ChartDefinition,
  marks: readonly (LineYMark | AreaYMark)[],
  width: number,
  height: number,
): Pick<ChartScene, 'grid' | 'ticks' | 'paths'> {
  const xOptions = definition.scales.x;
  const yOptions = definition.scales.y;
  if (!xOptions || !yOptions || marks.length === 0) {
    return { grid: [], ticks: [], paths: [] };
  }

  const all = marks.flatMap((mark) => mark.points);
  const x = instantiate(xOptions);
  const y = instantiate(yOptions);

  if (x.inferred) {
    if (isPointScale(x.scale)) {
      x.scale.domain(
        all.map((p) => (p.x instanceof Date ? p.x.getTime() : p.x)),
      );
    } else {
      const xs = all.map((p) => numeric(p.x));
      x.scale.domain([Math.min(...xs), Math.max(...xs)]);
    }
  }
  if (y.inferred && !isPointScale(y.scale)) {
    const ys = all.flatMap((p) => [p.y]);
    const hasArea = marks.some((mark) => mark.kind === 'areaY');
    if (hasArea) ys.push(...all.map((p) => p.y1));
    y.scale.domain([Math.min(...ys), Math.max(...ys)]);
  }
  // Tick density follows the plot height (about one tick per 60px).
  const yTickCount = Math.max(2, Math.floor((height - 32) / 60));
  if (yOptions.nice && !isPointScale(y.scale)) {
    y.scale.nice(
      typeof yOptions.nice === 'number' ? yOptions.nice : yTickCount,
    );
  }
  if (xOptions.nice && !isPointScale(x.scale)) {
    x.scale.nice(typeof xOptions.nice === 'number' ? xOptions.nice : undefined);
  }

  const showX = xOptions.axis !== false;
  const showY = yOptions.axis !== false;
  const yTicks = isPointScale(y.scale) ? [] : y.scale.ticks(yTickCount);
  const yFormat = isPointScale(y.scale)
    ? String
    : y.scale.tickFormat(yTickCount);
  const maxStroke = Math.max(
    1,
    ...marks.map(
      (mark) => mark.strokeWidth ?? (mark.kind === 'lineY' ? 1.5 : 0),
    ),
  );
  const inset = maxStroke / 2 + 1;
  const left = showY
    ? Math.max(...yTicks.map((t) => estimateLabelWidth(yFormat(t))), 24)
    : inset;
  const bottom = showX ? 24 : inset;
  const top = showY ? 8 : inset;
  const right = showX ? 12 : inset;

  const xRange: [number, number] = xOptions.reverse
    ? [width - right, left]
    : [left, width - right];
  const yRange: [number, number] = yOptions.reverse
    ? [top, height - bottom]
    : [height - bottom, top];
  x.scale.range(xRange);
  y.scale.range(yRange);

  const project = (value: ChartValue, scale: ChartScaleInstance): number => {
    if (isPointScale(scale)) {
      return scale(value instanceof Date ? value.getTime() : value) ?? NaN;
    }
    return scale(numeric(value)) ?? NaN;
  };

  const grid: SceneGridLine[] = [];
  const ticks: SceneTick[] = [];

  if (!isPointScale(y.scale)) {
    for (const t of yTicks) {
      const py = y.scale(t) ?? 0;
      if (yOptions.grid) {
        grid.push({
          key: `gy-${t}`,
          x1: left,
          y1: py,
          x2: width - right,
          y2: py,
        });
      }
      if (showY) {
        ticks.push({
          key: `ty-${t}`,
          x: left - 8,
          y: py + 3.5,
          text: yFormat(t),
          anchor: 'end',
        });
      }
    }
  }

  const xTickValues: (string | number)[] = isPointScale(x.scale)
    ? x.scale.domain()
    : x.scale.ticks(Math.max(2, Math.floor((width - left - right) / 80)));
  const stride = Math.max(
    1,
    Math.ceil(
      // Thin category labels only below ~40px each.
      xTickValues.length / Math.max(1, Math.floor((width - left - right) / 40)),
    ),
  );
  xTickValues.forEach((t, i) => {
    const px = project(t, x.scale);
    if (!Number.isFinite(px)) return;
    if (xOptions.grid) {
      grid.push({
        key: `gx-${t}`,
        x1: px,
        y1: top,
        x2: px,
        y2: height - bottom,
      });
    }
    if (showX && i % stride === 0) {
      const text =
        typeof t === 'number' && !isPointScale(x.scale)
          ? x.scale.tickFormat()(t)
          : String(t);
      ticks.push({
        key: `tx-${t}`,
        x: px,
        y: height - bottom + 16,
        text,
        anchor: 'middle',
      });
    }
  });

  const paths = marks.flatMap((mark, index): ScenePath[] => {
    if (mark.points.length === 0) return [];
    const coords = mark.points.map((p) => ({
      x: project(p.x, x.scale),
      y: project(p.y, y.scale),
      y1: project(p.y1, y.scale),
    }));
    const line = `M${coords.map((c) => pt(c.x, c.y)).join('L')}`;
    const id = mark.id ?? `${mark.kind}-${index}`;
    if (mark.kind === 'areaY') {
      const base = [...coords]
        .reverse()
        .map((c) => pt(c.x, c.y1))
        .join('L');
      return [
        {
          key: id,
          d: `${line}L${base}Z`,
          fill: mark.fill ?? 'currentColor',
          fillOpacity: mark.fillOpacity,
          stroke: mark.stroke,
          strokeWidth: mark.strokeWidth,
          className: 'ts-chart__area',
        },
      ];
    }
    return [
      {
        key: id,
        d: line,
        fill: 'none',
        stroke: mark.stroke ?? 'currentColor',
        strokeOpacity: mark.strokeOpacity,
        strokeWidth: mark.strokeWidth ?? 1.5,
        strokeDasharray: mark.strokeDasharray,
        className: 'ts-chart__line',
      },
    ];
  });

  return { grid, ticks, paths };
}

function resolveLength(
  length: PolarLength | undefined,
  context: PolarLayoutContext,
  fallback: number,
): number {
  if (length === undefined) return fallback;
  return typeof length === 'function' ? length(context) : length;
}

const onCircle = (cx: number, cy: number, r: number, angle: number) =>
  pt(cx + r * Math.sin(angle), cy - r * Math.cos(angle));

/** SVG path for an annular sector; mirrors d3-shape's arc with cornerRadius. */
function arcPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  a0: number,
  a1: number,
  corner: number,
): string {
  const [start, end] = a0 <= a1 ? [a0, a1] : [a1, a0];
  const sweep = end - start;
  const r0 = Math.max(0, Math.min(inner, outer));
  const r1 = Math.max(inner, outer);
  if (r1 <= EPSILON || sweep <= EPSILON) return '';

  if (sweep >= TAU - EPSILON) {
    const ring = `M${pt(cx, cy - r1)}A${r1},${r1},0,1,1,${pt(cx, cy + r1)}A${r1},${r1},0,1,1,${pt(cx, cy - r1)}`;
    if (r0 <= EPSILON) return `${ring}Z`;
    return `${ring}M${pt(cx, cy - r0)}A${r0},${r0},0,1,0,${pt(cx, cy + r0)}A${r0},${r0},0,1,0,${pt(cx, cy - r0)}Z`;
  }

  const s = Math.sin(Math.min(sweep, Math.PI) / 2);
  const limits = [corner, (r1 - r0) / 2, (r1 * s) / (1 + s)];
  if (r0 > EPSILON && s < 1) limits.push((r0 * s) / (1 - s));
  const rc = Math.max(0, Math.min(...limits));

  if (rc <= EPSILON) {
    const large = sweep > Math.PI ? 1 : 0;
    const outerArc = `M${onCircle(cx, cy, r1, start)}A${r1},${r1},0,${large},1,${onCircle(cx, cy, r1, end)}`;
    if (r0 <= EPSILON) return `${outerArc}L${pt(cx, cy)}Z`;
    return `${outerArc}L${onCircle(cx, cy, r0, end)}A${r0},${r0},0,${large},0,${onCircle(cx, cy, r0, start)}Z`;
  }

  // Outer corners: circle of radius rc tangent to the outer arc and the edge.
  const dOuter = r1 - rc;
  const deltaOuter = Math.asin(rc / dOuter);
  const edgeOuter = dOuter * Math.cos(deltaOuter);
  const outerLarge = sweep - 2 * deltaOuter > Math.PI ? 1 : 0;
  let d =
    `M${onCircle(cx, cy, edgeOuter, start)}` +
    `A${rc},${rc},0,0,1,${onCircle(cx, cy, r1, start + deltaOuter)}` +
    `A${r1},${r1},0,${outerLarge},1,${onCircle(cx, cy, r1, end - deltaOuter)}` +
    `A${rc},${rc},0,0,1,${onCircle(cx, cy, edgeOuter, end)}`;

  if (r0 <= EPSILON) return `${d}L${pt(cx, cy)}Z`;

  // Inner corners: circle tangent to the inner arc (from outside) and the edge.
  const dInner = r0 + rc;
  const deltaInner = Math.asin(rc / dInner);
  const edgeInner = dInner * Math.cos(deltaInner);
  const innerLarge = sweep - 2 * deltaInner > Math.PI ? 1 : 0;
  d +=
    `L${onCircle(cx, cy, edgeInner, end)}` +
    `A${rc},${rc},0,0,1,${onCircle(cx, cy, r0, end - deltaInner)}` +
    `A${r0},${r0},0,${innerLarge},0,${onCircle(cx, cy, r0, start + deltaInner)}` +
    `A${rc},${rc},0,0,1,${onCircle(cx, cy, edgeInner, start)}Z`;
  return d;
}

function compilePolar(
  mark: PolarMark,
  width: number,
  height: number,
): ScenePath[] {
  const { options } = mark;
  const context: PolarLayoutContext = {
    centerX: width / 2,
    centerY: height / 2,
    radius: Math.max(
      0,
      (Math.min(width, height) / 2 - (options.inset ?? 0)) *
        (options.radiusRatio ?? 1),
    ),
    startAngle: options.startAngle ?? 0,
    endAngle: options.endAngle ?? TAU,
  };

  return options.marks.flatMap((arc: RadialArcMark, markIndex) => {
    const inner = resolveLength(arc.innerRadius, context, 0);
    const outer = resolveLength(arc.outerRadius, context, context.radius);
    const corner = resolveLength(arc.cornerRadius, context, 0);
    return arc.slices.flatMap((slice, index) => {
      const half = slice.padAngle / 2;
      const d = arcPath(
        context.centerX,
        context.centerY,
        inner,
        outer,
        slice.startAngle + half,
        slice.endAngle - half,
        corner,
      );
      if (!d) return [];
      return [
        {
          key: `${arc.id ?? `arc-${markIndex}`}:${index}`,
          d,
          fill: slice.fill ?? 'currentColor',
          fillOpacity: arc.fillOpacity,
          stroke: slice.stroke,
          strokeOpacity: arc.strokeOpacity,
          strokeWidth: arc.strokeWidth,
          opacity: arc.opacity,
          className: arc.className ?? 'ts-chart__arc',
        },
      ];
    });
  });
}

export function compileScene(
  definition: ChartDefinition,
  width: number,
  height: number,
): ChartScene {
  const cartesianMarks = definition.marks.filter(
    (m): m is LineYMark | AreaYMark => m.kind === 'lineY' || m.kind === 'areaY',
  );
  const cartesian = compileCartesian(definition, cartesianMarks, width, height);
  const polarPaths = definition.marks
    .filter((m): m is PolarMark => m.kind === 'polar')
    .flatMap((m) => compilePolar(m, width, height));
  return {
    width,
    height,
    grid: cartesian.grid,
    ticks: cartesian.ticks,
    paths: [...cartesian.paths, ...polarPaths],
  };
}
