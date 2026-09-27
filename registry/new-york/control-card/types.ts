export interface ControlCardProps {
  /** Device name, e.g. `Ceiling lights`. */
  name: string;
  /** Where the device is, e.g. `Living room`. */
  location?: string;
  /** Lucide icon name without the prefix, e.g. `lamp-ceiling`. */
  icon?: string;
  /** Secondary reading shown while on, e.g. `21°C` or `4.2 kWh`. */
  stat?: string;
  /** Label for the level slider; the slider is hidden when omitted. */
  levelLabel?: string;
  /** Unit appended to the level, e.g. `%`. */
  levelUnit?: string;
  /** Accent color while on. Any CSS color. */
  color?: string;
  class?: string;
}
