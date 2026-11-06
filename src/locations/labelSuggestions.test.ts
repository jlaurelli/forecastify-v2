import { describe, expect, it } from "vitest";
import type { Location } from "./location";
import { labelSuggestions } from "./labelSuggestions";

const location = (overrides: Partial<Location>): Location => ({
  id: "1",
  name: "Paris",
  country: "France",
  countryCode: "FR",
  region: "Île-de-France",
  latitude: 48.85,
  longitude: 2.35,
  timezone: "Europe/Paris",
  ...overrides,
});

describe("labelSuggestions", () => {
  it("names a Location by its name and country", () => {
    expect(labelSuggestions([location({})])).toEqual(["Paris, France"]);
  });

  it("adds the state or province for US and Canadian Locations", () => {
    const suggestions = [
      location({ name: "Portland", country: "United States", countryCode: "US", region: "Oregon" }),
      location({ name: "Halifax", country: "Canada", countryCode: "CA", region: "Nova Scotia" }),
    ];

    expect(labelSuggestions(suggestions)).toEqual([
      "Portland, Oregon, United States",
      "Halifax, Nova Scotia, Canada",
    ]);
  });

  it("tells apart same-named Locations in one country by their region", () => {
    const costaRica = { name: "San José", country: "Costa Rica", countryCode: "CR" };
    const suggestions = [
      location({ ...costaRica, id: "1", region: "San José" }),
      location({ ...costaRica, id: "2", region: "Alajuela" }),
      location({ name: "San José", country: "Uruguay", countryCode: "UY", region: "San José" }),
    ];

    expect(labelSuggestions(suggestions)).toEqual([
      "San José, San José, Costa Rica",
      "San José, Alajuela, Costa Rica",
      "San José, Uruguay",
    ]);
  });

  it("leaves out the region when no same-named Location in that country is shown alongside", () => {
    const suggestions = [
      location({ name: "San José", country: "Costa Rica", countryCode: "CR", region: "San José" }),
    ];

    expect(labelSuggestions(suggestions)).toEqual(["San José, Costa Rica"]);
  });
});
