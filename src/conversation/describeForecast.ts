import type { Forecast } from "@/forecast/forecast";
import { formatForecastDays } from "@/forecast/formatForecastDays";
import type { UnitSystem } from "@/forecast/unitSystem";

/** A Forecast as the agent reads it: named, in the user's Unit System, units spelled out. */
export function describeForecast(name: string, forecast: Forecast, unitSystem: UnitSystem) {
  const temperatureUnit = unitSystem === "imperial" ? "F" : "C";
  return {
    location: name,
    unit_system: unitSystem,
    days: formatForecastDays(forecast, unitSystem).map((day, i) => ({
      day: day.day,
      date: forecast.days[i].date,
      condition: day.condition,
      high: day.high + temperatureUnit,
      low: day.low + temperatureUnit,
      precipitation_chance: day.precipitationChance,
      max_wind: day.maxWind,
    })),
  };
}
