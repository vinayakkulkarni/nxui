export interface VisualStepperStep {
  /** Step title (bold line). */
  title: string;
  /** Supporting description under the title. */
  description?: string;
}

export interface VisualStepperProps {
  /** Ordered list of steps. */
  steps: VisualStepperStep[];
  /** Auto-advance through steps. */
  autoplay?: boolean;
  /** Milliseconds each step stays active during autoplay. */
  interval?: number;
  /** Pause autoplay while the pointer is over the component. */
  pauseOnHover?: boolean;
  /** Show the preview card panel (left column). */
  showCard?: boolean;
  class?: string;
}
