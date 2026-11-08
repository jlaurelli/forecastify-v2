import { describe, expect, it } from "vitest";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import { ForecastUnavailable } from "@/forecast/getForecast";
import { conversationTools } from "./conversationTools";

const springfield = (id: string, region: string): Location => ({
  id,
  name: "Springfield",
  country: "United States",
  countryCode: "US",
  region,
  latitude: 39.8,
  longitude: -89.6,
  timezone: "America/Chicago",
});

const illinois = springfield("4250542", "Illinois");
const missouri = springfield("4409896", "Missouri");

const forecastFor = (location: Location): Forecast => ({
  location,
  days: [
    {
      date: "2026-11-06",
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
    },
  ],
});

function toolsFor(
  unitSystem: "metric" | "imperial" = "metric",
  overrides: Partial<Parameters<typeof conversationTools>[0]> = {},
) {
  const tools = conversationTools({
    unitSystem,
    searchLocations: async () => [illinois, missouri],
    getForecast: async (location) => forecastFor(location),
    ...overrides,
  });
  // Call a tool the way the agent would: by name, with JSON input.
  const call = (name: string, input: object) => {
    const tool = tools.find((candidate) => candidate.name === name)!;
    return (tool.run as (input: object) => Promise<unknown>)(input);
  };
  return {
    searchLocations: (name: string) => call("search_locations", { name }),
    getForecast: (locationId: string) => call("get_forecast", { location_id: locationId }),
  };
}

describe("conversationTools", () => {
  it("offers the agent each candidate Location with an id and its name", async () => {
    const { searchLocations } = toolsFor();

    expect(JSON.parse(String(await searchLocations("Springfield")))).toEqual({
      candidates: [
        { location_id: "4250542", name: "Springfield, Illinois, United States" },
        { location_id: "4409896", name: "Springfield, Missouri, United States" },
      ],
    });
  });

  it("gives a found Location's Forecast in the user's Unit System", async () => {
    const { searchLocations, getForecast } = toolsFor("imperial");
    await searchLocations("Springfield");

    expect(JSON.parse(String(await getForecast("4409896")))).toEqual({
      location: "Springfield, Missouri, United States",
      unit_system: "imperial",
      days: [
        {
          day: "Today",
          date: "2026-11-06",
          condition: "Rain",
          high: "58°F",
          low: "48°F",
          precipitation_chance: "74%",
          max_wind: "19 mph",
        },
      ],
    });
  });

  it("tells the agent when no place matches", async () => {
    const { searchLocations } = toolsFor("metric", { searchLocations: async () => [] });

    expect(JSON.parse(String(await searchLocations("Atlantis")))).toEqual({ candidates: [] });
  });

  it("refuses a location_id that no search in this answer found", async () => {
    const { getForecast } = toolsFor();

    await expect(getForecast("4409896")).rejects.toThrow(/search_locations first/i);
  });

  it("tells the agent when a Forecast is unavailable", async () => {
    const { searchLocations, getForecast } = toolsFor("metric", {
      getForecast: async () => {
        throw new ForecastUnavailable();
      },
    });
    await searchLocations("Springfield");

    await expect(getForecast("4409896")).rejects.toThrow(/forecast.*unavailable/i);
  });
});
