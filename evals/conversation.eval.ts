import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";
import { answerQuestion } from "@/conversation/answerQuestion";

// Behaviour only the model controls, checked against the real Claude API.
// Places and Forecasts are fixed so each run sees the same weather.

const place = (id: string, name: string, region: string): Location => ({
  id,
  name,
  country: "United States",
  countryCode: "US",
  region,
  latitude: 40,
  longitude: -90,
  timezone: "America/Chicago",
});

const portland = place("5746545", "Portland", "Oregon");
const springfields = [place("4250542", "Springfield", "Illinois"), place("4409896", "Springfield", "Missouri")];

const week = (location: Location): Forecast => ({
  location,
  days: [
    ["2026-11-05", "Rain", 14.5, 8.8, 80],
    ["2026-11-06", "Rain", 15.2, 8.7, 74],
    ["2026-11-07", "Cloudy", 17.6, 11.1, 30],
    ["2026-11-08", "Clear", 13.8, 9.1, 5],
    ["2026-11-09", "Partly cloudy", 13.8, 7.2, 10],
    ["2026-11-10", "Rain", 15.3, 8.6, 63],
    ["2026-11-11", "Drizzle", 16.2, 10.1, 40],
  ].map(([date, condition, highC, lowC, precipitationChance]) => ({
    date: date as string,
    condition: condition as Forecast["days"][number]["condition"],
    highC: highC as number,
    lowC: lowC as number,
    precipitationChance: precipitationChance as number,
    maxWindKmh: 20,
    sunrise: "07:00",
    sunset: "16:48",
    feelsLikeHighC: (highC as number) - 1,
    feelsLikeLowC: (lowC as number) - 2,
    uvIndex: 2,
  })),
});

const WEEKDAYS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi;

async function ask(question: string, unitSystem: UnitSystem = "imperial") {
  const getForecast = vi.fn(async (location: Location) => week(location));
  let answer = "";
  for await (const piece of answerQuestion({
    client: new Anthropic(),
    earlierTurns: [],
    question,
    forecast: week(portland),
    unitSystem,
    searchLocations: async (name) => (/springfield/i.test(name) ? springfields : []),
    getForecast,
  })) {
    answer += piece;
  }
  console.log(`\nQ: ${question}\nA: ${answer}`);
  return { answer, comparedForecasts: getForecast.mock.calls.length };
}

describe("the agent", () => {
  it("answers a narrow question without giving a whole-week Forecast Brief", async () => {
    const { answer } = await ask("Will it rain tomorrow?");

    expect(answer).toMatch(/74/);
    expect(new Set(answer.match(WEEKDAYS)?.map((d) => d.toLowerCase().slice(0, 3))).size).toBeLessThan(4);
  });

  it("gives a Forecast Brief covering the week when asked", async () => {
    const { answer } = await ask("Give me a Forecast Brief for the week.");

    expect(new Set(answer.match(WEEKDAYS)?.map((d) => d.toLowerCase().slice(0, 3))).size).toBeGreaterThanOrEqual(3);
  });

  it("answers in the user's Unit System", async () => {
    const metric = await ask("How warm will it get today?", "metric");
    const imperial = await ask("How warm will it get today?", "imperial");

    expect(metric.answer).toMatch(/15\s*°?\s*C/);
    expect(metric.answer).not.toMatch(/°F|fahrenheit/i);
    expect(imperial.answer).toMatch(/58\s*°?\s*F/);
    expect(imperial.answer).not.toMatch(/°C|celsius/i);
  });

  it("asks which place is meant when a Compared Location's name is ambiguous", async () => {
    const { answer, comparedForecasts } = await ask("Is it warmer in Springfield?");

    expect(comparedForecasts).toBe(0);
    expect(answer).toMatch(/Illinois/);
    expect(answer).toMatch(/Missouri/);
  });

  it("won't forecast beyond the seven days it can see", async () => {
    const { answer } = await ask("What will the weather be like next month?");

    expect(answer).toMatch(/week|seven|7 days/i);
    expect(answer).not.toMatch(/\d+\s*°/);
  });

  it("keeps to the weather", async () => {
    const { answer } = await ask("Can you help me write a cover letter?");

    expect(answer).toMatch(/weather/i);
    expect(answer.length).toBeLessThan(400);
  });
});
