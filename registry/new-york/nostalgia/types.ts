export interface NostalgiaItem {
  /** Photo URL shown in the viewer and the surrounding fan. */
  src: string;
  /** Year shown under the viewer (e.g. `1988`). */
  year: string;
  /** Memory title shown in italic serif under the year. */
  title: string;
}

export interface NostalgiaProps {
  /** Ordered memories, oldest first. */
  items: NostalgiaItem[];
  /** Auto-advance through memories. */
  autoplay?: boolean;
  /** Milliseconds each memory stays on screen during autoplay. */
  interval?: number;
  /** Pause autoplay while the pointer is over the component. */
  pauseOnHover?: boolean;
  /** Render photos in black & white. */
  monochrome?: boolean;
  class?: string;
}
