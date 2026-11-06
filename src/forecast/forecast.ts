import type { Location } from "@/locations/location";

export type Condition =
  | "Clear"
  | "Partly cloudy"
  | "Cloudy"
  | "Fog"
  | "Drizzle"
  | "Rain"
  | "Snow"
  | "Thunderstorm";

/** One day of a Forecast, always in metric; the Unit System is applied when shown. */
export type ForecastDay = {
  /** The day at the Location, as YYYY-MM-DD. */
  date: string;
  condition: Condition;
  highC: number;
  lowC: number;
  /** 0–100, or null when the provider has no estimate. */
  precipitationChance: number | null;
  maxWindKmh: number;
};

export type Forecast = {
  location: Location;
  days: ForecastDay[];
};
