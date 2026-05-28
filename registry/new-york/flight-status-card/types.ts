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

export interface FlightStatusCardProps {
  departureCode?: string;
  arrivalCode?: string;
  departureCity?: string;
  arrivalCity?: string;
  departureTime?: string;
  arrivalTime?: string;
  eta?: string;
  timezone?: string;
  nextEvent?: string;
  nextEventTime?: string;
  progress?: number;
  remainingTime?: string;
  class?: string;
}
