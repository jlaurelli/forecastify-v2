import { describe, expect, it } from "vitest";
import { LocationSearchFailed, searchLocations } from "./searchLocations";

const respondWith = (body: unknown, status = 200): typeof fetch =>
  async () => new Response(JSON.stringify(body), { status });

const portland = {
  id: 5746545,
  name: "Portland",
  latitude: 45.52345,
  longitude: -122.67621,
  country_code: "US",
  country: "United States",
  admin1: "Oregon",
  timezone: "America/Los_Angeles",
};

describe("searchLocations", () => {
  it("offers matching places as Locations", async () => {
    const suggestions = await searchLocations("Portl", {
      fetch: respondWith({ results: [portland] }),
    });

    expect(suggestions).toEqual([
      {
        id: "5746545",
        name: "Portland",
        country: "United States",
        countryCode: "US",
        region: "Oregon",
        latitude: 45.52345,
        longitude: -122.67621,
        timezone: "America/Los_Angeles",
      },
    ]);
  });

  it("names the country from its code when the provider leaves the name out", async () => {
    const withoutCountry = {
      ...portland,
      name: "San Jose",
      country: undefined,
      country_code: "MP",
      admin1: "Tinian",
    };

    const [suggestion] = await searchLocations("San Jos", {
      fetch: respondWith({ results: [withoutCountry] }),
    });

    expect(suggestion.country).toBe("Northern Mariana Islands");
  });

  it("offers at most the five closest matches, in the provider's order", async () => {
    const places = Array.from({ length: 7 }, (_, i) => ({
      ...portland,
      id: i + 1,
    }));

    const suggestions = await searchLocations("Portl", {
      fetch: respondWith({ results: places }),
    });

    expect(suggestions.map((s) => s.id)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it.each(["", "  ", "P", " P "])(
    "offers no Suggestions without asking the provider for %j",
    async (query) => {
      let providerCalled = false;
      const suggestions = await searchLocations(query, {
        fetch: async () => {
          providerCalled = true;
          return new Response(JSON.stringify({ results: [portland] }));
        },
      });

      expect(suggestions).toEqual([]);
      expect(providerCalled).toBe(false);
    },
  );

  it("reports a failed Location Search when the provider errors", async () => {
    const search = searchLocations("Portl", {
      fetch: respondWith({ error: true, reason: "Service unavailable" }, 503),
    });

    await expect(search).rejects.toBeInstanceOf(LocationSearchFailed);
  });

  it("reports a failed Location Search when the provider is unreachable", async () => {
    const search = searchLocations("Portl", {
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    await expect(search).rejects.toBeInstanceOf(LocationSearchFailed);
  });
});
