/** Health of one device. `warn` rows show under the Alerts filter. */
export type EquipmentStatus = 'ok' | 'warn' | 'idle';

/** Which rows the table shows. */
export type EquipmentFilter = 'all' | 'alerts';

/** One LCD tile above the table. */
export interface EquipmentTile {
  key: string;
  /** Upper-case label at the top left. */
  label: string;
  /** Note at the top right, e.g. `17.3 kWh`. */
  note?: string;
  value: number;
  /** Digits after the decimal point. */
  decimals?: number;
  unit?: string;
  /** Fill of the segmented bar, 0 to 1. */
  level: number;
  /** Digit and bar colour. */
  color: string;
}

/** A detail chart shown when a row opens. */
export interface EquipmentChart {
  /** Upper-case label of the chart. */
  label: string;
  /** Recent readings, oldest first. */
  points: number[];
  /** Dashed limit line. */
  limit?: number;
  /** Text for the limit, e.g. `Limit 45 °C`. */
  limitLabel?: string;
  /** Second line under the limit, e.g. `Fan 70 %`. */
  note?: string;
  /** Lowest value of the y axis. */
  min?: number;
}

/** One row of the device table. */
export interface EquipmentDevice {
  id: string;
  name: string;
  /** Second line under the name. */
  detail: string;
  status: EquipmentStatus;
  /** Fill of the level bar, 0 to 1. */
  level: number;
  /** Colour of the level bar. */
  levelColor?: string;
  /** Power in kW. Positive values get a `+` when `signed` is set. */
  power: number;
  signed?: boolean;
  /** Temperature in °C. `null` shows a dash. */
  temp: number | null;
  /** Chart shown when the row opens. */
  chart?: EquipmentChart;
  /** Label of the action button in the open row. Empty hides it. */
  action?: string;
}

export interface EquipmentPanelProps {
  title?: string;
  /** Subtitle. Defaults to the device count and reporting state. */
  subtitle?: string;
  /** Lucide icon name for the header chip. */
  icon?: string;
  tiles?: EquipmentTile[];
  devices?: EquipmentDevice[];
  /** Id of the open row. Use `v-model:expanded`. */
  expanded?: string | null;
  /** Row filter. Use `v-model:filter`. */
  filter?: EquipmentFilter;
  /** Nudges the values every couple of seconds so the panel looks live. */
  live?: boolean;
  /** Footer status text. */
  firmware?: string;
  addLabel?: string;
  /** Colour for warnings, the open row border and charts. */
  accent?: string;
  /** Colour of healthy status dots. */
  okColor?: string;
  class?: string;
}

/** Props of a segmented bar. */
export interface EquipmentBarProps {
  level: number;
  cells: number;
  color: string;
  /** Cell size class, e.g. `h-2.5 w-2`. */
  cellClass?: string;
  /** Class for unlit cells. */
  trackClass?: string;
}

/** Props of a table row. */
export interface EquipmentRowProps {
  device: EquipmentDevice;
  open: boolean;
  accent: string;
  okColor: string;
  /** Live temperature and power, after the wobble. */
  power: number;
  temp: number | null;
  /** Live chart points. */
  points: number[];
  /** Text on the action button while a check runs. */
  busy: boolean;
}

/** Props of the detail chart. */
export interface EquipmentChartProps {
  chart: EquipmentChart;
  color: string;
}

/** Values of one row after the live wobble. */
export interface EquipmentLive {
  power: number;
  temp: number | null;
  points: number[];
}
