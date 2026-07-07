export interface PodcastChapter {
  /** Chapter start time in seconds. */
  time: number;
  /** Chapter label. */
  label: string;
}

export interface PodcastWaveformProps {
  /** Normalized bar heights (0–1). */
  heights: number[];
  /** Played fraction (0–1). */
  progress: number;
  /** Total duration in seconds (for the hover tooltip). */
  duration: number;
  /** Accent color for played bars. */
  accent: string;
}

export interface PodcastPlayerProps {
  /** Audio file URL — the player drives a real HTMLAudioElement. */
  src: string;
  /** Episode title. */
  title: string;
  /** Show / channel name (rendered uppercase). */
  show: string;
  /** Release date string (e.g. `12/31/2025`). */
  date?: string;
  /** Star rating (e.g. `4.6`). */
  rating?: string;
  /** Rating count (e.g. `30K`). */
  ratingCount?: string;
  /** Meta segments after the rating (e.g. `['Business', 'Updated daily']`). */
  meta?: string[];
  /** Episode description shown in the expanded view. */
  description?: string;
  /** Chapter markers shown in the expanded view. */
  chapters?: PodcastChapter[];
  /** Accent color for the waveform progress, play button, and toggles. */
  accent?: string;
  /** Number of waveform bars. */
  bars?: number;
  class?: string;
}
