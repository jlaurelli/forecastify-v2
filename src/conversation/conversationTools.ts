import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";
import { labelSuggestions } from "@/locations/labelSuggestions";
import { describeForecast } from "./describeForecast";

type Dependencies = {
  unitSystem: UnitSystem;
  searchLocations: (query: string) => Promise<Location[]>;
  getForecast: (location: Location) => Promise<Forecast>;
};

/**
 * The tools the agent uses to find and look up Compared Locations. Create a
 * fresh set for each answer: a location_id is only valid within the answer
 * whose search found it.
 */
export function conversationTools({ unitSystem, searchLocations, getForecast }: Dependencies) {
  const found = new Map<string, { location: Location; name: string }>();

  return [
    betaZodTool({
      name: "search_locations",
      eager_input_streaming: true,
      description:
        "Find places matching a name, to compare against the Selected Location. Returns up to five candidates.",
      inputSchema: z.object({ name: z.string().describe("A place name, e.g. Lisbon") }),
      run: async ({ name }) => {
        const candidates = await searchLocations(name);
        const labels = labelSuggestions(candidates);
        candidates.forEach((location, i) => found.set(location.id, { location, name: labels[i] }));
        return JSON.stringify({
          candidates: candidates.map((location, i) => ({
            location_id: location.id,
            name: labels[i],
          })),
        });
      },
    }),
    betaZodTool({
      name: "get_forecast",
      eager_input_streaming: true,
      description: "Get the seven-day Forecast for a candidate found by search_locations.",
      inputSchema: z.object({
        location_id: z.string().describe("A location_id from search_locations"),
      }),
      run: async ({ location_id }) => {
        const candidate = found.get(location_id);
        if (!candidate) {
          throw new Error(
            `Unknown location_id ${location_id}. Use search_locations first and pass one of its location_ids.`,
          );
        }
        const { location, name } = candidate;
        return JSON.stringify(describeForecast(name, await getForecast(location), unitSystem));
      },
    }),
  ];
}
