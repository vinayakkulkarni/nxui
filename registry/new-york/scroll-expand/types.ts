import type { CSSProperties } from 'vue';

export type ScrollExpandMediaType = 'image' | 'video';

export interface ScrollExpandProps {
  /** Image or video URL shown inside the frame. */
  src: string;
  /** Whether the source is an image or a looping muted video. */
  mediaType?: ScrollExpandMediaType;
  /** Poster frame used while a video loads. */
  poster?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Headline held over the frame that lifts away as the media takes over. */
  title?: string;
  /** Small cue shown under the resting frame that fades away as soon as the scroll begins. */
  scrollHint?: string;
  /** Frame width before expanding, as a percentage of the stage. */
  startWidth?: number;
  /** Frame height before expanding, as a percentage of the stage. */
  startHeight?: number;
  /** Corner radius of the resting frame, in px. */
  startRadius?: number;
  /** Corner radius once fully expanded, in px. */
  endRadius?: number;
  /** How far the media is zoomed in at rest. Eases back to 1 as the frame opens up. */
  mediaZoom?: number;
  /** Scroll length of the expansion, in multiples of the stage height. */
  scrollDistance?: number;
  /** Extra scroll the frame stays pinned at full bleed before releasing. */
  holdDistance?: number;
  /** Follow time in seconds. 0 locks the frame exactly to the scrollbar. */
  smoothing?: number;
  /** Strength of the gradient scrim that fades in to keep overlay content readable. */
  overlayScrim?: number;
  /** Drive the expansion from the page scroll instead of the component's own scroller. */
  useWindowScroll?: boolean;
  /** Enable or disable the expansion. */
  enabled?: boolean;
  /** Extra classes for the root element. */
  class?: string;
  /** Inline styles for the root element. */
  style?: CSSProperties;
}
