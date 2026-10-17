export interface SquishSwitchProps {
  /** Controlled state (`v-model`). Leave it out to let the switch keep its own. */
  modelValue?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** A label beside the switch, wired to it. */
  label?: string;
  /** Dimmed and inert. */
  disabled?: boolean;
  /** The track while off. */
  trackColor?: string;
  /** The track while on. */
  trackOnColor?: string;
  /** The thumb while off. Empty mixes the on colour faintly into the track. */
  thumbColor?: string;
  /** The thumb while on. Empty uses the off track colour. */
  thumbOnColor?: string;
  /** Track width in px. */
  width?: number;
  /** Track height in px. The thumb and its inset follow. */
  height?: number;
  /** Track corner radius in px, capped at half the height. */
  radius?: number;
  /** Stiffness of the settle spring, 0 to 100. Low is lazy, high is snappy. */
  speed?: number;
  /** How much the thumb lengthens with speed, 0 to 100. It narrows to keep its area. */
  stretch?: number;
  /** The thumb swells to this on hover. */
  hoverScale?: number;
  /** The colour cross-fade, in ms. */
  colorDuration?: number;
  /** Accessible name when there is no label. */
  ariaLabel?: string;
  /** Id for the switch button; the label uses it. */
  id?: string;
  class?: string;
}

export interface SquishSwitchGrip {
  id: number;
  grab: number | null;
  moved: boolean;
  startX: number;
  onAtPress: boolean;
  slop: number;
}
