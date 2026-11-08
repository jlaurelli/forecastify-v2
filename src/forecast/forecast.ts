import { z } from "zod";
import { locationSchema } from "@/locations/location";

export const conditionSchema = z.enum([
  "Clear",
  "Partly cloudy",
  "Cloudy",
  "Fog",
  "Drizzle",
  "Rain",
  "Snow",
  "Thunderstorm",
]);

export type Condition = z.infer<typeof conditionSchema>;

/** Local time at the Location as HH:MM. */
const timeOfDay = z.string().regex(/^\d{2}:\d{2}$/);

/** One day of a Forecast, always in metric; the Unit System is applied when shown. */
export const forecastDaySchema = z.object({
  /** The day at the Location, as YYYY-MM-DD. */
  date: z.string(),
  condition: conditionSchema,
  highC: z.number(),
  lowC: z.number(),
  /** 0–100, or null when the provider has no estimate. */
  precipitationChance: z.number().nullable(),
  maxWindKmh: z.number(),
  /** Null when the sun doesn't rise or set that day. */
  sunrise: timeOfDay.nullable(),
  sunset: timeOfDay.nullable(),
  feelsLikeHighC: z.number(),
  feelsLikeLowC: z.number(),
  /** Null when the provider has no estimate. */
  uvIndex: z.number().nullable(),
});

export type ForecastDay = z.infer<typeof forecastDaySchema>;

export const forecastSchema = z.object({
  location: locationSchema,
  days: z.array(forecastDaySchema),
});

export type Forecast = z.infer<typeof forecastSchema>;
