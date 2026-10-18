import type { ButtonHTMLAttributes, VNode } from 'vue';

/** Indicator style in the horizontal layout. */
export type StepperIndicator = 'numbers' | 'dots' | 'bars';

/** Indicators across the top, or a rail beside the content. */
export type StepperOrientation = 'horizontal' | 'vertical';

/** How the content changes between steps. */
export type StepperTransition = 'slide' | 'fade' | 'none';

/** Color theme of the panel and controls. */
export type StepperTheme = 'dark' | 'light';

/** Status of one step relative to the current one. */
export type StepperStatus = 'complete' | 'active' | 'upcoming';

/** Extra attributes for the Back / Continue buttons. */
export type StepperButtonProps = ButtonHTMLAttributes & {
  onClick?: (event: MouseEvent) => void;
};

/**
 * Props for the Stepper registry component.
 */
export interface StepperProps {
  /** The step shown first when `v-model:step` is not used. */
  initialStep?: number;
  /** Style of the step indicators in the horizontal layout. */
  indicator?: StepperIndicator;
  /** Indicators across the top, or a rail of numbered steps beside the content. */
  orientation?: StepperOrientation;
  /** How the content changes between steps. The height always animates. */
  transition?: StepperTransition;
  /** Only lets the indicators jump back to steps that have been reached. */
  linear?: boolean;
  /** Stops the indicators from changing the step when clicked. */
  disableStepIndicators?: boolean;
  /** Shows the Back and Continue buttons. */
  showFooter?: boolean;
  /** Text of the Back button. */
  backButtonText?: string;
  /** Text of the Continue button. */
  nextButtonText?: string;
  /** Text of the Continue button on the last step. */
  completeButtonText?: string;
  /** Extra attributes for the Back button. */
  backButtonProps?: StepperButtonProps;
  /** Extra attributes for the Continue button, e.g. `{ disabled: true }`. */
  nextButtonProps?: StepperButtonProps;
  /** Color theme of the panel and controls. */
  theme?: StepperTheme;
  /** Color of completed steps, the progress bars and the Continue button. */
  accentColor?: string;
  /** Shows the frosted panel around the stepper. */
  frame?: boolean;
  /** Corner radius of the panel in px. */
  radius?: number;
  /** Maximum width of the stepper (px number or CSS width). */
  width?: number | string;
  /** Extra classes on the root. */
  class?: string;
  /** Extra classes on the indicator row. */
  stepContainerClass?: string;
  /** Extra classes on the content area. */
  contentClass?: string;
  /** Extra classes on the footer. */
  footerClass?: string;
}

/**
 * Props for one StepperStep.
 */
export interface StepperStepProps {
  /** Label shown in the indicator, or beside it in the vertical layout. */
  title?: string;
  /** Second line shown beside the indicator in the vertical layout. */
  description?: string;
  /** Iconify name (e.g. `lucide:truck`) shown in the indicator instead of the number. */
  icon?: string;
}

/** A step collected from the default slot. */
export interface StepperEntry {
  node: VNode;
  title?: string;
  description?: string;
  icon?: string;
}

/** Scope of the `#indicator` slot. */
export interface StepperIndicatorSlotProps {
  step: number;
  currentStep: number;
  status: StepperStatus;
  onStepClick: (step: number) => void;
}

/** Transition bookkeeping: the step on screen and the one leaving. */
export interface StepperView {
  step: number;
  previous: number | null;
  direction: number;
  id: number;
}
