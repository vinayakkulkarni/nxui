export type AuraSpeedTestPhase = 'idle' | 'testing' | 'done';

export interface AuraSpeedTestResult {
  download: number;
  upload: number;
  ping: number;
  packetLoss: number;
}

export interface AuraSpeedTestProps {
  /** Network name shown in the header. */
  label?: string;
  /** Final download speed in Mbps. */
  download?: number;
  /** Final upload speed in Mbps. */
  upload?: number;
  /** Final ping in ms. */
  ping?: number;
  /** Jitter in ms, shown under the ping. */
  jitter?: number;
  /** Packet loss in percent (0–100). */
  packetLoss?: number;
  /** Note under the upload value. */
  uploadNote?: string;
  /** Nearest server code. */
  server?: string;
  /** Distance to the server, e.g. `4 km`. */
  distance?: string;
  /** Length of one run in milliseconds. */
  duration?: number;
  /** Start a run the first time the widget scrolls into view. */
  autoRun?: boolean;
  /** Chip text while a run is in progress. */
  testingLabel?: string;
  /** Chip text after a run. */
  resultLabel?: string;
  /** Number of spectrum columns. */
  columns?: number;
  /** Paint the violet aura stage behind the glass. */
  backdrop?: boolean;
  class?: string;
}

export interface AuraSpeedTestEmits {
  start: [];
  complete: [result: AuraSpeedTestResult];
}

export interface AuraSpeedTestSpectrumProps {
  /** Lit dots per column. `0` draws an unmeasured column. */
  levels: number[];
  rows: number;
  /** Enlarge the top dot of the last column. */
  highlight: boolean;
}

export interface AuraSpeedTestLossDot {
  /** Order in which the packet arrives (0 = first). */
  rank: number;
  lost: boolean;
  late: boolean;
}

export interface AuraSpeedTestLossProps {
  dots: AuraSpeedTestLossDot[];
  /** Packets that have arrived so far. */
  received: number;
}

export interface AuraSpeedTestRadarProps {
  testing: boolean;
}
