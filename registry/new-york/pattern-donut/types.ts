/** Texture used for a cause in the outer ring, in rank order by default. */
export type PatternDonutPatternKind =
  | 'lines'
  | 'dots'
  | 'checker'
  | 'crosshatch'
  | 'grid'
  | 'stripes';

export interface PatternDonutCause {
  label: string;
  value: number;
}

export interface PatternDonutCategory {
  label: string;
  value: number;
  /** Any CSS color. Used for the solid slice, its textures and the legend. */
  color: string;
  /**
   * Breakdown shown in the outer ring. Causes are sorted by value; the
   * largest gets the first pattern (lines), the next dots, then checker.
   * Without causes the whole outer segment uses the first pattern.
   */
  causes?: PatternDonutCause[];
}

export interface PatternDonutProps {
  data: PatternDonutCategory[];
  title?: string;
  description?: string;
  /** Unit after the total, e.g. `min`. */
  unit?: string;
  /** Change against the previous period, in percent. Hidden when undefined. */
  delta?: number;
  /** Text after the delta, e.g. `vs Aug`. */
  deltaLabel?: string;
  /** A falling value is good news (green). Set `false` for metrics where up is good. */
  lowerIsBetter?: boolean;
  /** Labels for the pattern key, in rank order. */
  patternLabels?: string[];
  /** Order of textures by cause rank. */
  patterns?: PatternDonutPatternKind[];
  /** Share (0–1) the insight pill counts top categories up to. */
  insightThreshold?: number;
  /** Words after the share in the insight pill. */
  insightSuffix?: string;
  /** Hides the insight pill. */
  hideInsight?: boolean;
  /** Locale for number formatting. */
  locale?: string;
  class?: string;
}

export interface PatternDonutPatternProps {
  id: string;
  kind: PatternDonutPatternKind;
  color: string;
  /** Tile size in user units. */
  size?: number;
  /** Opacity of the color tint behind the texture. */
  tint?: number;
}

/** A solid slice in the inner ring. */
export interface PatternDonutSlice {
  index: number;
  label: string;
  value: number;
  color: string;
  share: number;
  path: string;
}

/** A textured cause segment in the outer ring. */
export interface PatternDonutSegment {
  key: string;
  index: number;
  cause: string;
  value: number;
  color: string;
  rank: number;
  kind: PatternDonutPatternKind;
  patternId: string;
  path: string;
}

export interface PatternDonutHover {
  index: number;
  cause: string | null;
}

export interface PatternDonutInsight {
  count: number;
  share: number;
}

export interface PatternDonutKeyItem {
  kind: PatternDonutPatternKind;
  label: string;
  id: string;
}
