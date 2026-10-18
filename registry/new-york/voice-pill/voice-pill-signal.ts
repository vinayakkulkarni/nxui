import type { VoicePillState } from './types';

const LOOP = 4.8;
/** [start s, duration s, peak] of each simulated syllable in the loop. */
const SYLLABLES: Array<[number, number, number]> = [
  [0.1, 0.16, 0.9],
  [0.3, 0.12, 0.7],
  [0.5, 0.2, 1],
  [0.95, 0.14, 0.8],
  [1.15, 0.1, 0.6],
  [1.3, 0.22, 0.95],
  [1.9, 0.16, 0.85],
  [2.12, 0.12, 0.7],
  [2.3, 0.18, 0.9],
  [2.55, 0.1, 0.5],
  [3.05, 0.24, 1],
  [3.4, 0.12, 0.75],
  [3.6, 0.16, 0.9],
];
const MIC_BINS: Array<[number, number]> = [
  [1, 4],
  [4, 11],
  [11, 33],
];
const MIC_GAIN = 2.2;
const WAVE_EVERY = 4;
const WAVE_MAX = 80;

export const DT_MAX = 0.05;
export const SLIDE_MIN = 4;

/** A speech-like level at time `t` seconds. */
export function simulatedLevel(t: number): number {
  const u = t % LOOP;
  let a = 0.06;
  for (const [s, d, p] of SYLLABLES) {
    const x = (u - s) / d;
    if (x >= 0 && x <= 1)
      a = Math.max(a, p * 0.5 * (1 - Math.cos(2 * Math.PI * x)));
  }
  return a * (0.7 + 0.3 * Math.abs(Math.sin(2 * Math.PI * 7.1 * u)));
}

/** Voice-band level from a live analyser. */
export function micLevel(
  analyser: AnalyserNode,
  buf: Uint8Array<ArrayBuffer>,
): number {
  analyser.getByteFrequencyData(buf);
  let total = 0;
  for (const [lo, hi] of MIC_BINS) {
    let s = 0;
    for (let i = lo; i < hi; i += 1) s += buf[i] ?? 0;
    total += s / ((hi - lo) * 255);
  }
  return (total / MIC_BINS.length) * MIC_GAIN;
}

/** Push the level into the history and paint the scrolling bars. */
export function drawWave(
  s: VoicePillState,
  canvas: HTMLCanvasElement,
  level: number,
  color: string,
  floor: number,
): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, Math.round(rect.width * dpr));
  const H = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  s.acc = Math.max(s.acc, level);
  s.tick = (s.tick + 1) % WAVE_EVERY;
  if (s.tick === 0) {
    s.hist.push(s.acc);
    s.acc = 0;
    if (s.hist.length > WAVE_MAX) s.hist.shift();
  }
  const bw = 2 * dpr;
  const step = 3 * dpr;
  const shift = (s.tick / WAVE_EVERY) * step;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  for (let i = 0; i < s.hist.length; i += 1) {
    const v = s.hist[s.hist.length - 1 - i] ?? 0;
    const x = W - (i + 1) * step - shift;
    if (x + bw < 0) break;
    const h = Math.max(bw, (floor + (1 - floor) * v) * H);
    const t = Math.min(1, Math.max(0, (x + bw / 2) / (W * 0.55)));
    const fade = t * t * (3 - 2 * t);
    ctx.globalAlpha = (0.35 + 0.65 * v) * fade;
    ctx.beginPath();
    ctx.roundRect(x, (H - h) / 2, bw, h, bw / 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** `m:ss` from milliseconds. */
export function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Open the microphone into an analyser on `s.audio`. */
export async function openMic(s: VoicePillState): Promise<void> {
  if (
    typeof AudioContext === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error('unsupported');
  }
  s.audio ??= {
    ctx: new AudioContext(),
    stream: null,
    src: null,
    analyser: null,
    buf: null,
  };
  const a = s.audio;
  if (a.ctx.state === 'suspended') void a.ctx.resume();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (!s.listening) {
    stream.getTracks().forEach((t) => t.stop());
    return;
  }
  a.stream = stream;
  a.src = a.ctx.createMediaStreamSource(stream);
  a.analyser = a.ctx.createAnalyser();
  a.analyser.fftSize = 256;
  a.analyser.smoothingTimeConstant = 0;
  a.src.connect(a.analyser);
  a.buf = new Uint8Array(a.analyser.frequencyBinCount);
}

/** Stop the microphone tracks and drop the graph (the context is kept). */
export function closeMic(s: VoicePillState): void {
  const a = s.audio;
  if (!a?.stream) return;
  a.stream.getTracks().forEach((t) => t.stop());
  a.src?.disconnect();
  a.stream = null;
  a.src = null;
  a.analyser = null;
  a.buf = null;
}
