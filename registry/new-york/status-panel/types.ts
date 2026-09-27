export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export interface StatusService {
  id: string;
  name: string;
  status: ServiceStatus;
  /** Uptime over the reporting window, e.g. `99.98`. */
  uptime?: number;
  /** Latest response time in milliseconds. */
  latency?: number;
}

export type StatusEventLevel = 'info' | 'warning' | 'error' | 'success';

export interface StatusEvent {
  id: string;
  /** ISO timestamp or Date. */
  time: string | Date;
  message: string;
  level: StatusEventLevel;
}

export interface StatusStyle {
  label: string;
  dot: string;
  text: string;
}

export interface StatusPanelProps {
  title?: string;
  services: StatusService[];
  events?: StatusEvent[];
  /** Log entries kept on screen; older ones scroll away. */
  maxEvents?: number;
  class?: string;
}
