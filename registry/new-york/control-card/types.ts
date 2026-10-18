export interface ControlCardStat {
  /** Lucide icon name without the prefix, e.g. `gauge`. */
  icon: string;
  /** Reading, e.g. `Speed ~ 1GB`. */
  value: string;
  /** Caption under the reading, e.g. `Active`. */
  label: string;
}

export interface ControlCardProps {
  /** Device type, e.g. `Wi-Fi`. */
  category: string;
  /** Device name, e.g. `Starlink Internet`. */
  name: string;
  /** Lucide icon name without the prefix, e.g. `wifi`. */
  icon: string;
  stat?: ControlCardStat;
  /** Power button color while on. Any CSS color. */
  color?: string;
  class?: string;
}
