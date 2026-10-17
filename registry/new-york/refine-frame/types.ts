export type RefineFrameStatus =
  | 'queued'
  | 'generating'
  | 'refining'
  | 'complete'
  | 'error';

export type RefineFrameLabels = Partial<Record<RefineFrameStatus, string>>;

export interface RefineFrameProps {
  /** The stage. Each change tweens the media to that stage. */
  status?: RefineFrameStatus;
  /** The box reserved before and during generation, so nothing shifts. */
  aspectRatio?: string;
  /** Frame width in px, capped at the parent. */
  width?: number;
  /** Corner radius in px. */
  radius?: number;
  /** The paper behind the media, and the chip surface. */
  background?: string;
  /** The ink: chip text, the sweep and the retry pill. */
  color?: string;
  /** Each stage tween, in ms. */
  stageDuration?: number;
  /** A soft band crosses the frame while it works. */
  sweep?: boolean;
  /** The chip with the mark and the stage label. */
  showStatus?: boolean;
  /** Ms after completion before the chip fades. 0 keeps it. */
  hideAfter?: number;
  /** Chip text per stage. */
  labels?: RefineFrameLabels;
  /** The pill on an error. */
  retryLabel?: string;
  /** Bound by `@retry`. Without a listener, no retry pill is shown. */
  onRetry?: () => void;
  class?: string;
}

export interface RefineFrameStage {
  blur: number;
  sat: number;
  scale: number;
  opacity: number;
}

export interface RefineFrameSim {
  p: number;
  raf: number;
  last: number;
  key: string;
  w: number;
  h: number;
  levels: HTMLCanvasElement[];
  glint: CanvasGradient | null;
  sent: boolean;
}
