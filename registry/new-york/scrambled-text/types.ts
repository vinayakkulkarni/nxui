export type ScrambledTextEffect = 'scramble' | 'lift' | 'blur' | 'magnify';

export interface ScrambledTextProps {
  /** The text to scramble. */
  text: string;
  /** Distance from the pointer, in px, within which letters react. */
  radius?: number;
  /** How long a letter right under the pointer keeps scrambling, in seconds. Also paces the intro and the click burst. */
  duration?: number;
  /** How often a scrambling letter swaps to a new character. Higher flickers faster. */
  speed?: number;
  /** The characters shown while a letter is scrambled. */
  scrambleChars?: string;
  /** Color of letters while scrambled. Empty keeps the text color. */
  scrambleColor?: string;
  /** What letters near the pointer do: scramble, rise, blur, or swell like a lens. */
  effect?: ScrambledTextEffect;
  /** How far letters lift, how much they blur, or how much they magnify. */
  strength?: number;
  /** Seconds lifted, blurred or magnified letters take to settle after the pointer moves on. */
  trail?: number;
  /** Clicking sends a scramble wave outward from the click point, carrying the current effect. */
  clickBurst?: boolean;
  /** Decode the whole text from scrambled characters the first time it scrolls into view. */
  intro?: boolean;
  /** Font of the text. Empty keeps the default monospace. */
  fontFamily?: string;
  /** Color of the text. Empty follows the surrounding text color. */
  color?: string;
  class?: string;
}

export interface ScrambledTextSettings {
  radius: number;
  duration: number;
  speed: number;
  scrambleChars: string;
  scrambleColor: string;
  effect: ScrambledTextEffect;
  strength: number;
  trail: number;
  clickBurst: boolean;
}

export interface ScrambledTextEngine {
  /** Drops every lifted/blurred/magnified letter back to rest. */
  reset: () => void;
  destroy: () => void;
}

export interface ScrambledTextPoint {
  x: number;
  y: number;
  energy: number;
  dx: number;
  dy: number;
  shown: boolean;
}

export interface ScrambledTextWave {
  x: number;
  y: number;
  age: number;
  r: number;
  fade: number;
  reach: number;
  life: number;
  hit: Uint8Array;
}

export interface ScrambledTextTween {
  elapsed: number;
  duration: number;
  sinceSwap: number;
}
