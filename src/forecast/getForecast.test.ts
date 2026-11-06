import { describe, expect, it } from "vitest";
import type { Location } from "@/locations/location";
import { ForecastUnavailable, getForecast } from "./getForecast";

const respondWith = (body: unknown, status = 200): typeof fetch =>
  async () => new Response(JSON.stringify(body), { status });

const portland: Location = {
  id: "5746545",
  name: "Portland",
  country: "United States",
  countryCode: "US",
  region: "Oregon",
  latitude: 45.52,
  longitude: -122.68,
  timezone: "America/Los_Angeles",
};

const sevenDays = {
  daily: {
    time: [
      "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
      "2026-11-09", "2026-11-10", "2026-11-11",
    ],
    weather_code: [0, 2, 3, 45, 53, 63, 95],
    temperature_2m_max: [14.5, 15.2, 17.6, 13.8, 13.8, 15.3, 16.2],
    temperature_2m_min: [8.8, 8.7, 11.1, 9.1, 7.2, 8.6, 10.1],
    precipitation_probability_max: [13, 74, 86, 86, 57, 63, 40],
    wind_speed_10m_max: [11.2, 20.5, 31.0, 18.4, 9.9, 14.0, 25.3],
  },
};

describe("getForecast", () => {
  it("gives seven Forecast Days for the Location, starting with its today", async () => {
    const forecast = await getForecast(portland, {
      fetch: respondWith(sevenDays),
    });

    expect(forecast.location).toBe(portland);
    expect(forecast.days).toHaveLength(7);
    expect(forecast.days[0]).toEqual({
      date: "2026-11-05",
      condition: "Clear",
      highC: 14.5,
      lowC: 8.8,
      precipitationChance: 13,
      maxWindKmh: 11.2,
    });
    expect(forecast.days.map((day) => day.date)).toEqual(sevenDays.daily.time);
  });

  // WMO weather interpretation codes, as documented by Open-Meteo.
  it.each([
    [0, "Clear"], // clear sky
    [1, "Clear"], // mainly clear
    [2, "Partly cloudy"],
    [3, "Cloudy"], // overcast
    [45, "Fog"], [48, "Fog"], // fog, depositing rime fog
    [51, "Drizzle"], [53, "Drizzle"], [55, "Drizzle"],
    [56, "Drizzle"], [57, "Drizzle"], // freezing drizzle
    [61, "Rain"], [63, "Rain"], [65, "Rain"],
    [66, "Rain"], [67, "Rain"], // freezing rain
    [80, "Rain"], [81, "Rain"], [82, "Rain"], // rain showers
    [71, "Snow"], [73, "Snow"], [75, "Snow"], [77, "Snow"], // snow, snow grains
    [85, "Snow"], [86, "Snow"], // snow showers
    [95, "Thunderstorm"], [96, "Thunderstorm"], [99, "Thunderstorm"], // with hail
  ])("describes weather code %i as %s", async (code, condition) => {
    const forecast = await getForecast(portland, {
      fetch: respondWith({
        daily: { ...sevenDays.daily, weather_code: Array(7).fill(code) },
      }),
    });

    expect(forecast.days[0].condition).toBe(condition);
  });

  it("reports the Forecast as unavailable when the provider errors", async () => {
    const forecast = getForecast(portland, {
      fetch: respondWith({ error: true, reason: "Service unavailable" }, 503),
    });

    await expect(forecast).rejects.toBeInstanceOf(ForecastUnavailable);
  });

  it("reports the Forecast as unavailable when the provider is unreachable", async () => {
    const forecast = getForecast(portland, {
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    await expect(forecast).rejects.toBeInstanceOf(ForecastUnavailable);
  });

  it("reports the Forecast as unavailable rather than guess at an unknown weather code", async () => {
    const forecast = getForecast(portland, {
      fetch: respondWith({
        daily: { ...sevenDays.daily, weather_code: [0, 0, 0, 42, 0, 0, 0] },
      }),
    });

    await expect(forecast).rejects.toBeInstanceOf(ForecastUnavailable);
  });
});
