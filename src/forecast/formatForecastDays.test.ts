import { describe, expect, it } from "vitest";
import type { Location } from "@/locations/location";
import type { Forecast, ForecastDay } from "./forecast";
import { formatForecastDays } from "./formatForecastDays";

const portland = { name: "Portland" } as Location;

const day = (overrides: Partial<ForecastDay>): ForecastDay => ({
  date: "2026-11-05",
  condition: "Rain",
  highC: 14.5,
  lowC: 8.8,
  precipitationChance: 74,
  maxWindKmh: 20.5,
  ...overrides,
});

const forecastOf = (...days: ForecastDay[]): Forecast => ({ location: portland, days });

describe("formatForecastDays", () => {
  it("shows a Forecast Day in metric", () => {
    expect(formatForecastDays(forecastOf(day({})), "metric")).toEqual([
      {
        day: "Today",
        condition: "Rain",
        high: "15°",
        low: "9°",
        precipitationChance: "74%",
        maxWind: "21 km/h",
      },
    ]);
  });

  it("shows a Forecast Day in imperial", () => {
    const [shown] = formatForecastDays(
      forecastOf(day({ highC: 14.5, lowC: 8.8, maxWindKmh: 31 })),
      "imperial",
    );

    expect(shown).toMatchObject({ high: "58°", low: "48°", maxWind: "19 mph" });
  });

  it("labels the first day Today and the rest by weekday", () => {
    const dates = [
      "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
      "2026-11-09", "2026-11-10", "2026-11-11",
    ];

    const shown = formatForecastDays(forecastOf(...dates.map((date) => day({ date }))), "metric");

    expect(shown.map((d) => d.day)).toEqual(["Today", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"]);
  });

  it("shows a dash when there is no precipitation estimate", () => {
    const [shown] = formatForecastDays(forecastOf(day({ precipitationChance: null })), "metric");

    expect(shown.precipitationChance).toBe("—");
  });

  it("never shows a negative zero", () => {
    const [metric] = formatForecastDays(forecastOf(day({ highC: -0.4, lowC: -0.2 })), "metric");
    // -17.9 °C is -0.22 °F
    const [imperial] = formatForecastDays(forecastOf(day({ lowC: -17.9 })), "imperial");

    expect([metric.high, metric.low, imperial.low]).toEqual(["0°", "0°", "0°"]);
  });
});
