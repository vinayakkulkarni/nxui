export interface WeatherDay {
  /** Weekday label, e.g. 'Mon'. */
  day: string;
  /** Date number, e.g. 3. */
  date: number;
  /** Condition label. */
  condition: string;
  /** High temperature in °F (unit toggle converts). */
  temp: number;
}

export interface WeatherForecastProps {
  /** City shown in the header. */
  city?: string;
  /** Days in the strip. */
  days?: WeatherDay[];
  /** Initial unit. */
  unit?: 'f' | 'c';
  /** Auto-advance through days; 0 disables. */
  autoplayInterval?: number;
  class?: string;
}

export interface WeatherForecastEmits {
  /** Fires when the selected day changes. */
  change: [day: WeatherDay, index: number];
}
