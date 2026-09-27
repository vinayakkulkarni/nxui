// Public types for the hand-rolled chart engine. Every name and option below
// mirrors @tanstack/charts 0.18.0 so a definition written for this engine also
// type-checks against TanStack Charts. Only a subset is implemented; options
// TanStack supports but this engine does not are deliberately absent, so using
// one fails type-checking instead of being silently ignored.
import type { StyleValue } from 'vue';

export type ChartValue = string | number | Date;
export type ChartKey = string | number;

export interface ChannelAccessorContext<TDatum> {
  index: number;
  data: readonly TDatum[];
}

export type ChannelAccessor<TDatum, TValue> = (
  datum: TDatum,
  context: ChannelAccessorContext<TDatum>,
) => TValue;

/** Keys of `TDatum` whose value type fits `TValue`. */
export type ChannelField<TDatum, TValue> = {
  [TKey in Extract<keyof TDatum, string>]-?: TDatum[TKey] extends TValue
    ? TKey
    : never;
}[Extract<keyof TDatum, string>];

export type Channel<TDatum, TValue> =
  | ChannelField<TDatum, TValue>
  | ChannelAccessor<TDatum, TValue>;

/** A constant, or an accessor evaluated per datum. */
export type VisualChannel<TDatum, TValue> =
  | TValue
  | ChannelAccessor<TDatum, TValue>;

export interface LinearScale {
  (value: number | null | undefined): number | undefined;
  domain(): [number, number];
  domain(values: Iterable<number>): LinearScale;
  range(): [number, number];
  range(values: Iterable<number>): LinearScale;
  invert(value: number): number;
  clamp(): boolean;
  clamp(value: boolean): LinearScale;
  ticks(count?: number): number[];
  tickFormat(count?: number): (value: number) => string;
  nice(count?: number): LinearScale;
  copy(): LinearScale;
}

export interface PointScale<TDomain extends string | number = string> {
  (value: TDomain | null | undefined): number | undefined;
  domain(): TDomain[];
  domain(values: Iterable<TDomain>): PointScale<TDomain>;
  range(): [number, number];
  range(values: Iterable<number>): PointScale<TDomain>;
  padding(): number;
  padding(value: number): PointScale<TDomain>;
  step(): number;
  copy(): PointScale<TDomain>;
}

export type ChartScaleInstance = LinearScale | PointScale<string | number>;
export type ChartScaleFactory = () => ChartScaleInstance;

export interface ChartAxisPresentationOptions {
  label?: string;
}

export interface ChartPositionScaleOptions {
  /** A factory infers its domain from the marks; an instance keeps its own. */
  scale: ChartScaleFactory | ChartScaleInstance;
  nice?: boolean | number;
  reverse?: boolean;
  grid?: boolean;
  /** False keeps the scale but omits the visible axis. */
  axis?: false | ChartAxisPresentationOptions;
}

/** Unused scales must be declared `null`, as TanStack Charts requires. */
export type ChartScales = Readonly<
  Record<string, ChartPositionScaleOptions | null>
>;

interface MarkStrokeOptions<TDatum> {
  stroke?: VisualChannel<TDatum, string>;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface LineYOptions<TDatum> extends MarkStrokeOptions<TDatum> {
  id?: string;
  x?: Channel<TDatum, ChartValue | null | undefined>;
  y?: Channel<TDatum, number | null | undefined>;
}

export interface AreaYOptions<TDatum> {
  id?: string;
  x?: Channel<TDatum, ChartValue | null | undefined>;
  y?: Channel<TDatum, number | null | undefined>;
  y1?: number | Channel<TDatum, number | null | undefined>;
  fill?: VisualChannel<TDatum, string>;
  fillOpacity?: number;
  stroke?: VisualChannel<TDatum, string>;
  strokeWidth?: number;
}

export interface PolarLayoutContext {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

/** Pixels, or a function of the resolved polar layout. */
export type PolarLength = number | ((context: PolarLayoutContext) => number);

export interface RadialArcOptions<TDatum> {
  id?: string;
  className?: string;
  startAngle?: Channel<TDatum, number | null | undefined>;
  endAngle?: Channel<TDatum, number | null | undefined>;
  padAngle?: Channel<TDatum, number | null | undefined>;
  innerRadius?: PolarLength;
  outerRadius?: PolarLength;
  cornerRadius?: PolarLength;
  fill?: VisualChannel<TDatum, string>;
  fillOpacity?: number;
  stroke?: VisualChannel<TDatum, string>;
  strokeOpacity?: number;
  strokeWidth?: number;
  opacity?: number;
}

export type TransformValue<TDatum, TValue> =
  | {
      [TKey in Extract<keyof TDatum, string>]-?: NonNullable<
        TDatum[TKey]
      > extends TValue
        ? TKey
        : never;
    }[Extract<keyof TDatum, string>]
  | ChannelAccessor<TDatum, TValue>;

export interface PieOptions<TDatum> {
  readonly value: TransformValue<TDatum, number | null | undefined>;
  /** Overall start angle in radians. Defaults to 0 at 12 o'clock. */
  readonly startAngle?: number;
  /** Overall end angle in radians. Defaults to 2π. */
  readonly endAngle?: number;
  /** Empty angle between visible slices. Defaults to 0. */
  readonly gapAngle?: number;
}

type PieDerivedField =
  | 'value'
  | 'index'
  | 'fraction'
  | 'startAngle'
  | 'endAngle'
  | 'angle'
  | 'padAngle'
  | 'source'
  | 'sourceIndexes';

export type PieDatum<TDatum extends object> = Omit<TDatum, PieDerivedField> & {
  readonly source: readonly TDatum[];
  readonly sourceIndexes: readonly number[];
  readonly value: number;
  readonly index: number;
  readonly fraction: number;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly angle: number;
  readonly padAngle: 0;
};

export type PolarScales = Readonly<Record<string, null>>;

// Internal mark records. Builders evaluate every channel while the datum type
// is still known, so a mark stores only render-ready values and carries no
// datum generic. Marks over different datum types then share one list.
export interface CartesianPoint {
  readonly x: ChartValue;
  readonly y: number;
  readonly y1: number;
}

export interface LineYMark {
  readonly kind: 'lineY';
  readonly id?: string;
  readonly points: readonly CartesianPoint[];
  readonly stroke?: string;
  readonly strokeOpacity?: number;
  readonly strokeWidth?: number;
  readonly strokeDasharray?: string;
}

export interface AreaYMark {
  readonly kind: 'areaY';
  readonly id?: string;
  readonly points: readonly CartesianPoint[];
  readonly fill?: string;
  readonly fillOpacity?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

export interface ArcSlice {
  readonly startAngle: number;
  readonly endAngle: number;
  readonly padAngle: number;
  readonly fill?: string;
  readonly stroke?: string;
}

export interface RadialArcMark {
  readonly kind: 'radialArc';
  readonly id?: string;
  readonly className?: string;
  readonly slices: readonly ArcSlice[];
  readonly innerRadius?: PolarLength;
  readonly outerRadius?: PolarLength;
  readonly cornerRadius?: PolarLength;
  readonly fillOpacity?: number;
  readonly strokeOpacity?: number;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export interface PolarOptions {
  id?: string;
  className?: string;
  marks: readonly RadialArcMark[];
  scales: PolarScales;
  startAngle?: number;
  endAngle?: number;
  /** Pixel inset applied before radiusRatio. */
  inset?: number;
  /** Multiplier applied to the final available radius. Defaults to 1. */
  radiusRatio?: number;
}

export interface PolarMark {
  readonly kind: 'polar';
  readonly options: PolarOptions;
}

export type ChartMark = LineYMark | AreaYMark | PolarMark;

export interface ChartSpec {
  marks: readonly ChartMark[];
  scales: ChartScales;
}

export interface ChartDefinition {
  readonly marks: readonly ChartMark[];
  readonly scales: ChartScales;
}

export interface ChartHostProps {
  definition: ChartDefinition;
  /**
   * Required, as in TanStack Charts. Pass it as `v-bind="{ ariaLabel }"`: Vue's
   * type checker reads a literal `aria-label` as an HTML attribute, not this prop.
   */
  ariaLabel: string;
  ariaDescription?: string;
  height?: number;
  width?: number;
  /** Width / height, used when `height` is omitted. */
  aspectRatio?: number;
  /** Width used for the server render before the container is measured. */
  initialWidth?: number;
}

/** Host props plus presentation props, typed as in TanStack Charts. */
export interface ChartProps extends ChartHostProps {
  class?: string;
  style?: StyleValue;
}

// Scene: the renderer-neutral output of compiling a definition at a size.
export interface ScenePath {
  readonly key: string;
  readonly d: string;
  readonly fill: string;
  readonly fillOpacity?: number;
  readonly stroke?: string;
  readonly strokeOpacity?: number;
  readonly strokeWidth?: number;
  readonly strokeDasharray?: string;
  readonly opacity?: number;
  readonly className?: string;
}

export interface SceneGridLine {
  readonly key: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface SceneTick {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly anchor: 'start' | 'middle' | 'end';
}

export interface ChartScene {
  readonly width: number;
  readonly height: number;
  readonly grid: readonly SceneGridLine[];
  readonly ticks: readonly SceneTick[];
  readonly paths: readonly ScenePath[];
}
