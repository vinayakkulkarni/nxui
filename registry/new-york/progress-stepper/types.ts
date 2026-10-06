export type ProgressStepStatus = 'complete' | 'active' | 'pending';

export type ProgressStepperAlign = 'right' | 'left';

export type ProgressStepperMarkerSize = 'lg' | 'sm';

export interface ProgressSubStep {
  id: string;
  title: string;
  /** Overrides the status derived from `current-child`. */
  status?: ProgressStepStatus;
}

export interface ProgressStep {
  id: string;
  title: string;
  /** Second line under the title. Defaults to "Step N". */
  description?: string;
  /** Overrides the status derived from `current`. */
  status?: ProgressStepStatus;
  children?: ProgressSubStep[];
}

export interface ResolvedSubStep extends ProgressSubStep {
  status: ProgressStepStatus;
}

export interface ResolvedStep extends ProgressStep {
  status: ProgressStepStatus;
  number: number;
  children: ResolvedSubStep[];
}

export interface ProgressStepperProps {
  steps: ProgressStep[];
  /** `right`: labels sit left of the rail. `left`: labels sit right of it. */
  align?: ProgressStepperAlign;
  /** Shows "Step N" under steps without a description. */
  showStepLabel?: boolean;
  class?: string;
}

export interface ProgressStepperMarkerProps {
  status: ProgressStepStatus;
  size?: ProgressStepperMarkerSize;
}
