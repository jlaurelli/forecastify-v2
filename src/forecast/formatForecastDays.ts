import type { Forecast } from "./forecast";
import type { UnitSystem } from "./unitSystem";

export type FormattedForecastDay = {
  day: string;
  condition: string;
  high: string;
  low: string;
  precipitationChance: string;
  maxWind: string;
};

const KM_PER_MILE = 1.609344;

// Dates are already days at the Location, so read them in UTC to keep the
// viewer's own timezone from shifting them.
const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });

/** How each Forecast Day is shown to the user, in the given Unit System. */
export function formatForecastDays(
  forecast: Forecast,
  unitSystem: UnitSystem,
): FormattedForecastDay[] {
  const temperature = (celsius: number) =>
    `${Math.round(unitSystem === "imperial" ? (celsius * 9) / 5 + 32 : celsius)}°`;
  const wind = (kmh: number) =>
    unitSystem === "imperial"
      ? `${Math.round(kmh / KM_PER_MILE)} mph`
      : `${Math.round(kmh)} km/h`;

  return forecast.days.map((day, i) => ({
    day: i === 0 ? "Today" : weekday.format(new Date(day.date)),
    condition: day.condition,
    high: temperature(day.highC),
    low: temperature(day.lowC),
    precipitationChance:
      day.precipitationChance === null ? "—" : `${day.precipitationChance}%`,
    maxWind: wind(day.maxWindKmh),
  }));
}
