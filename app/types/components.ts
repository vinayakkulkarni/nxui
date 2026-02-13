export type AnimationType =
  | 'fadeIn'
  | 'blurIn'
  | 'blurInUp'
  | 'blurInDown'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleUp'
  | 'scaleDown';

export type SplitBy = 'text' | 'word' | 'character';

export type FlightStatus = 'boarding' | 'in-flight' | 'landed' | 'delayed';

export interface AirportInfo {
  city: string;
  code: string;
  time: string;
}

export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: AirportInfo;
  arrival: AirportInfo;
  status: FlightStatus;
  gate?: string;
  progress: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface CommandItem {
  label: string;
  icon?: string;
  shortcut?: string;
  group?: string;
  onSelect?: () => void;
}

export interface DockItem {
  icon: string;
  label: string;
  onClick?: () => void;
}

export interface GeometricShape {
  type: 'circle' | 'triangle' | 'square' | 'diamond';
  size: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

export interface CollectionItem {
  id: string;
  title: string;
  description: string;
  color: string;
  image?: string;
}
