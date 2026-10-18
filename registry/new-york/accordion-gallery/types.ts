import type { HTMLAttributes } from 'vue';

export interface AccordionGalleryItem {
  /** Image URL. */
  image: string;
  /** Caption shown on the open panel and its accessible name. */
  label?: string;
  /** When set, the panel is a link. The first click on a closed panel only opens it. */
  link?: string;
  /** Alt text. Falls back to the label. */
  alt?: string;
}

export type AccordionGalleryOrientation = 'horizontal' | 'vertical';

export type AccordionGalleryTrigger = 'hover' | 'click';

export interface AccordionGalleryProps {
  /** Panels to display. */
  items?: AccordionGalleryItem[];
  /** Index of the panel that starts open. */
  defaultIndex?: number;
  /** Colour of the caption bar and focus ring. */
  accentColor?: string;
  /** Tint over closed panels and the caption gradient. */
  overlayColor?: string;
  /** Caption text colour. */
  textColor?: string;
  /** Height in pixels (vertical orientation uses 1.6×). */
  height?: number;
  /** Space between panels in pixels. */
  gap?: number;
  /** Corner radius of each panel in pixels. */
  radius?: number;
  /** Share of the row the open panel takes (0.2–0.9). */
  expandRatio?: number;
  /** Lay panels out in a row or a column. */
  orientation?: AccordionGalleryOrientation;
  /** Transition length in seconds. */
  duration?: number;
  /** GSAP-style ease name, e.g. "power3.out", "expo.inOut", "none". */
  ease?: string;
  /** How far closed images shift toward the open panel (0 disables it). */
  parallax?: number;
  /** 3D tilt of closed panels in degrees. */
  tilt?: number;
  /** Delay between the caption bar and the caption text in seconds. */
  stagger?: number;
  /** Open a panel on hover or only on click. */
  trigger?: AccordionGalleryTrigger;
  /** Show the caption on the open panel. */
  showLabels?: boolean;
  /** Closed panels are grayscale; the open one is in colour. */
  grayscale?: boolean;
  class?: HTMLAttributes['class'];
}

export interface AccordionTweenTrack {
  from: number;
  to: number;
  delay: number;
  duration: number;
  apply: (value: number) => void;
}

export interface AccordionPanelState {
  grow: number;
  rot: number;
  mx: number;
  my: number;
  gray: number;
  dim: number;
  barOpacity: number;
  barX: number;
  textOpacity: number;
  textX: number;
}
