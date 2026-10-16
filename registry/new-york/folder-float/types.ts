import type Matter from 'matter-js';

/** A pill: a string is its own value. */
export type FolderFloatItem = string | FolderFloatEntry;

/** A pill with a separate label and value. */
export interface FolderFloatEntry {
  label: string;
  value: string;
}

/** Open on hover, or toggle on press. */
export type FolderFloatTrigger = 'hover' | 'click';

/** Props for the FolderFloat registry component. */
export interface FolderFloatProps {
  /** The pills that float out. */
  items?: FolderFloatItem[];
  /** The line on the flap. */
  label?: string;
  /** The dimmer line under it. Empty counts the notes. */
  sublabel?: string;
  /** Open on hover, or toggle on press. */
  trigger?: FolderFloatTrigger;
  /** Start open. */
  defaultOpen?: boolean;
  /** Picking a pill closes the folder. */
  closeOnSelect?: boolean;
  /** Once the pills land, a zero-gravity world takes over: drag and throw them. */
  physics?: boolean;
  /** Strength of the floating currents. 0 holds still. */
  drift?: number;
  /** The back panel and its tab. */
  folderColor?: string;
  /** The flap. */
  frontColor?: string;
  /** The paper edge that rises as it opens. */
  paperColor?: string;
  /** The pills. */
  itemColor?: string;
  /** The pill text. */
  itemTextColor?: string;
  /** The flap text. */
  labelColor?: string;
  /** Folder width in px. */
  width?: number;
  /** Folder height in px, below the tab. */
  height?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Half the widest the cloud may be, in px. */
  spread?: number;
  /** Gap between the folder and the lowest row, in px. */
  lift?: number;
  /** Most a pill leans, in degrees. */
  tilt?: number;
  /** How far the flap tilts toward you when open, in degrees. */
  flapAngle?: number;
  /** The flap tilt when closed, in degrees. */
  restAngle?: number;
  /** A pill's rise, in ms. The close is 60% of it. */
  openDuration?: number;
  /** Delay between pills, in ms. The close reverses the order. */
  stagger?: number;
  /** Overshoot of the rise. 0 lands dead. */
  bounce?: number;
  /** Extra classes on the root. */
  class?: string;
}

/** Measured pill size. */
export interface FolderFloatSize {
  w: number;
  h: number;
}

/** Resting pill placement relative to the cloud anchor. */
export interface FolderFloatPos {
  x: number;
  y: number;
  r: number;
}

/** Bounds the physics bodies are fenced into. */
export interface FolderFloatZone {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Active pill drag. */
export interface FolderFloatDrag {
  i: number;
  id: number;
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  moved: boolean;
}

/** Mutable physics world (never reactive). */
export interface FolderFloatWorld {
  engine: Matter.Engine | null;
  bodies: Matter.Body[];
  phases: number[];
  sizes: FolderFloatSize[];
  raf: number;
  last: number;
  t0: number;
  drag: FolderFloatDrag | null;
  zone: FolderFloatZone | null;
}
