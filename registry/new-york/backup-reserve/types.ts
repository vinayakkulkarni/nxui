/** Values the card saves. */
export interface BackupReserveSettings {
  /** Reserve held back for outages, 0–100 %. */
  reserve: number;
  /** Fill the battery to 100 % before a storm alert. */
  stormWatch: boolean;
  /** Max charging rate from the grid, in kW. */
  gridRate: number;
}

/** How one LCD bar segment is drawn. */
export type BackupReserveCellKind =
  | 'reserved'
  | 'reserved-empty'
  | 'usable'
  | 'free';

export interface BackupReserveSliderProps {
  min: number;
  max: number;
  step: number;
  color: string;
  label: string;
}

export interface BackupReserveDisplayProps {
  reserve: number;
  battery: number;
  hours: number;
  cells: number;
  charging: boolean;
  color: string;
  usableColor: string;
}

export interface BackupReserveProps {
  title?: string;
  subtitle?: string;
  /** Text in the status pill. Hidden when empty. */
  status?: string;
  /** Current battery charge, 0–100 %. */
  battery?: number;
  /** Battery capacity in kWh. Used for the hours estimate. */
  capacity?: number;
  /** Load of the essential circuits in kW. Used for the hours estimate. */
  essentialLoad?: number;
  /** Quick-pick reserve values. */
  presets?: number[];
  /** Segments in the LCD bar. */
  cells?: number;
  /** Blink the top battery segment, as if charging. */
  charging?: boolean;
  gridRateMin?: number;
  gridRateMax?: number;
  gridRateStep?: number;
  stormTitle?: string;
  stormDescription?: string;
  gridTitle?: string;
  gridDescription?: string;
  cancelLabel?: string;
  saveLabel?: string;
  /** Reserve and LCD accent colour. */
  color?: string;
  /** Colour of the usable part of the battery. */
  usableColor?: string;
  class?: string;
}
