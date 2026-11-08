// @vitest-environment node
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import { forecastDay } from "@/forecast/forecastFixtures";
import { AnswerUnavailable, answerQuestion } from "./answerQuestion";
import { fakeClaude, type ScriptedReply } from "./fakeClaude";

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

const forecastFor = (location: Location, highC = 14.5): Forecast => ({
  location,
  days: [forecastDay({ date: "2026-11-06", highC })],
});

async function ask(question: string, replies: ScriptedReply[], overrides = {}) {
  const claude = fakeClaude(replies);
  const client = new Anthropic({ apiKey: "test-key", fetch: claude.fetch, maxRetries: 0 });
  let answer = "";
  const deltas: string[] = [];
  for await (const delta of answerQuestion({
    client,
    earlierTurns: [],
    question,
    forecast: forecastFor(portland),
    unitSystem: "imperial",
    searchLocations: async () => [],
    getForecast: async (location) => forecastFor(location),
    ...overrides,
  })) {
    deltas.push(delta);
    answer += delta;
  }
  return { answer, deltas, requests: claude.requests };
}

describe("answerQuestion", () => {
  it("streams the agent's answer about the Selected Location's Forecast", async () => {
    const { answer, deltas, requests } = await ask("Will it rain today?", [
      { blocks: [{ type: "text", text: "Yes, a 74% chance of rain today in Portland." }] },
    ]);

    expect(answer).toBe("Yes, a 74% chance of rain today in Portland.");
    expect(deltas.length).toBeGreaterThan(1);
    const sent = JSON.stringify(requests[0].body.messages);
    expect(sent).toContain("Will it rain today?");
    expect(sent).toContain("Portland, Oregon, United States");
    expect(sent).toContain("58°F");
  });

  it("looks up a Compared Location's Forecast and sends it back to the agent", async () => {
    const lisbon: Location = {
      ...portland,
      id: "2267057",
      name: "Lisbon",
      country: "Portugal",
      countryCode: "PT",
      region: "Lisbon",
      timezone: "Europe/Lisbon",
    };

    const { answer, requests } = await ask(
      "Is it warmer in Lisbon?",
      [
        { blocks: [{ type: "tool_use", id: "tu_1", name: "search_locations", input: { name: "Lisbon" } }] },
        { blocks: [{ type: "tool_use", id: "tu_2", name: "get_forecast", input: { location_id: "2267057" } }] },
        { blocks: [{ type: "text", text: "Yes, Lisbon is warmer." }] },
      ],
      {
        searchLocations: async () => [lisbon],
        getForecast: async (location: Location) => forecastFor(location, 22),
      },
    );

    expect(answer).toBe("Yes, Lisbon is warmer.");
    expect(requests).toHaveLength(3);
    const lastToolResult = JSON.stringify(requests[2].body.messages.at(-1));
    expect(lastToolResult).toContain("Lisbon, Portugal");
    expect(lastToolResult).toContain("72°F"); // 22 °C
  });

  it("reports the answer as unavailable when the agent declines", async () => {
    const answer = ask("Will it rain today?", [
      { blocks: [{ type: "text", text: "" }], stopReason: "refusal" },
    ]);

    await expect(answer).rejects.toBeInstanceOf(AnswerUnavailable);
  });

  it("reports the answer as unavailable when the Claude API fails", async () => {
    const answer = ask("Will it rain today?", [{ status: 500 }]);

    await expect(answer).rejects.toBeInstanceOf(AnswerUnavailable);
  });

  it("resends earlier turns exactly as they were first sent", async () => {
    const first = await ask("Will it rain today?", [
      { blocks: [{ type: "text", text: "Yes, 74%." }] },
    ]);

    const second = await ask("And in Celsius?", [{ blocks: [{ type: "text", text: "15°C." }] }], {
      unitSystem: "metric",
      earlierTurns: [
        {
          question: "Will it rain today?",
          forecast: forecastFor(portland),
          unitSystem: "imperial",
          answer: "Yes, 74%.",
        },
      ],
    });

    const [earlierQuestion, earlierAnswer, newQuestion] = second.requests[0].body.messages;
    expect(earlierQuestion).toEqual(first.requests[0].body.messages[0]);
    expect(earlierAnswer).toEqual({ role: "assistant", content: "Yes, 74%." });
    expect(JSON.stringify(newQuestion)).toContain("15°C");
  });
});
