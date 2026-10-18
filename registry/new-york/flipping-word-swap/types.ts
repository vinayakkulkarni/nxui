import type { StyleValue } from 'vue';

export type FlippingWordSwapLayer = 'first' | 'second';

export interface FlippingWordSwapProps {
  /** The word or short phrase shown at rest. */
  word1: string;
  /** The word or short phrase revealed on interaction. */
  word2: string;
  /** Duration of each character flip in milliseconds. */
  duration?: number;
  /** Delay between neighboring character flips in milliseconds. */
  stagger?: number;
  /** Additional classes applied to the interactive container. */
  class?: string;
  /** Additional classes applied only to the revealed word. */
  toClass?: string;
  /** Inline styles applied only to the revealed word. */
  toStyle?: StyleValue;
}

export interface FlippingWordSwapTiming {
  /** Seconds each character takes to flip. */
  duration: number;
  /** Seconds between neighboring characters. */
  stagger: number;
  /** Seconds after the first word starts that the second word starts. */
  offset: number;
  /** Total timeline length in seconds. */
  total: number;
}
