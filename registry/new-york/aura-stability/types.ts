export interface AuraStabilityRun {
  /** Time or name of the run, e.g. `09:00`. */
  label: string;
  /** Smallest drift in the run, in percent. */
  min: number;
  /** Largest drift in the run, in percent. */
  max: number;
}

export interface AuraStabilityMarker {
  /** Short marker name, e.g. `B`. */
  label: string;
  /** Drift in percent where the guide line sits. */
  value: number;
}

export interface AuraStabilityProps {
  runs?: AuraStabilityRun[];
  /** Stability score in percent, shown in the glow. */
  stability?: number;
  /** Headline. Empty builds one from the runs. */
  title?: string;
  /** Dashed guide lines across the chart. */
  markers?: AuraStabilityMarker[];
  /** Word above the score. */
  label?: string;
  /** Highlighted run. `-1` highlights the run with the largest drift. */
  active?: number;
  /** Paint the night-sky stage behind the capsule. */
  backdrop?: boolean;
  class?: string;
}

export interface AuraStabilityEmits {
  'update:active': [index: number];
}

export interface AuraStabilityStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
}
