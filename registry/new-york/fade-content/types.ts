export type FadeContentEffect =
  | 'fade'
  | 'focus'
  | 'develop'
  | 'dissolve'
  | 'mist'
  | 'pixel';
export type FadeContentStaggerFrom =
  | 'start'
  | 'end'
  | 'center'
  | 'edges'
  | 'random';
export type FadeContentTrigger = 'scroll' | 'mount';
export type FadeNoiseKind = 'dissolve' | 'mist' | 'pixel';

export interface FadeContentProps {
  /** Scroll container that drives the fade, as a selector or an element. Defaults to the page. */
  container?: string | HTMLElement | null;
  /** How the content appears. */
  effect?: FadeContentEffect;
  /** Extra blur the content starts from, in px. `true` adds 10px. */
  blur?: boolean | number;
  /** Length of the fade in seconds. Values above 10 are read as milliseconds. */
  duration?: number;
  /** GSAP-style ease name, such as 'power3.out', 'expo.out' or 'none'. */
  ease?: string;
  /** Wait before the fade starts, in seconds. Values above 10 are read as milliseconds. */
  delay?: number;
  /** How far into the viewport the top of the content must be before it fades in, 0–1. */
  threshold?: number;
  /** Opacity the content starts from. */
  initialOpacity?: number;
  /** Fades each direct child in turn, this many seconds apart. */
  stagger?: number;
  /** Which child goes first when staggering. */
  staggerFrom?: FadeContentStaggerFrom;
  /** Fade in when the content scrolls into view, or right away. */
  trigger?: FadeContentTrigger;
  /** Fades in once. Turn off to fade back out when the content scrolls back below the view. */
  once?: boolean;
  /** Fades the content back out as it scrolls off the top, and in again when it comes back. */
  exit?: boolean;
  /** Ties the fade to the scroll position. A number smooths it, in seconds. */
  scrub?: boolean | number;
  /** Fades the content out again this many seconds after it appears. 0 keeps it shown. */
  disappearAfter?: number;
  /** Length of the fade out, in seconds. */
  disappearDuration?: number;
  /** GSAP-style ease of the fade out. */
  disappearEase?: string;
  class?: string;
}

export type FadeEaseFn = (t: number) => number;

/** Animatable channels of a look. Absent channels are not written. */
export interface FadeChannels {
  alpha?: number;
  blur?: number;
  scale?: number;
  gray?: number;
  contrast?: number;
  bright?: number;
}

export interface FadeLook {
  from: FadeChannels;
  to: FadeChannels;
  /** Fraction of the duration this look takes. */
  share: number;
}

export interface FadeNoiseMask {
  state: { progress: number };
  render: () => void;
  remove: () => void;
}

export interface FadeEngineOptions {
  el: HTMLElement;
  scroller: HTMLElement | null;
  effect: FadeContentEffect;
  blur: number;
  duration: number;
  ease: string;
  delay: number;
  threshold: number;
  initialOpacity: number;
  stagger: number;
  staggerFrom: FadeContentStaggerFrom;
  trigger: FadeContentTrigger;
  once: boolean;
  exit: boolean;
  scrub: boolean | number;
  disappearAfter: number;
  disappearDuration: number;
  disappearEase: string;
  reduce: boolean;
  onStart: () => void;
  onComplete: () => void;
  onDisappearanceComplete: () => void;
}
