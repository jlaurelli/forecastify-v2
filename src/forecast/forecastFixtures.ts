import type { ForecastDay } from "./forecast";

/** A rainy Forecast Day for tests; override only what a test is about. */
export const forecastDay = (overrides: Partial<ForecastDay> = {}): ForecastDay => ({
  date: "2026-11-05",
  condition: "Rain",
  highC: 14.5,
  lowC: 8.8,
  precipitationChance: 74,
  maxWindKmh: 31,
  sunrise: "07:00",
  sunset: "16:48",
  feelsLikeHighC: 13.1,
  feelsLikeLowC: 6.2,
  uvIndex: 2.7,
  ...overrides,
});
