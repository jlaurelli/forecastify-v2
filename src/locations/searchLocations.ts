import type { Location } from "./location";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const MAX_SUGGESTIONS = 5;
export const MIN_QUERY_LENGTH = 2;

type OpenMeteoPlace = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  country?: string;
  admin1?: string;
  timezone: string;
};

type Options = { fetch?: typeof fetch };

export class LocationSearchFailed extends Error {
  constructor(options?: ErrorOptions) {
    super("Location Search failed", options);
    this.name = "LocationSearchFailed";
  }
}

export async function searchLocations(
  query: string,
  { fetch: fetchFn = fetch }: Options = {},
): Promise<Location[]> {
  const name = query.trim();
  if (name.length < MIN_QUERY_LENGTH) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", String(MAX_SUGGESTIONS));
  let response: Response;
  try {
    response = await fetchFn(url);
  } catch (cause) {
    throw new LocationSearchFailed({ cause });
  }
  if (!response.ok) throw new LocationSearchFailed();

  const body: { results?: OpenMeteoPlace[] } = await response.json();
  return (body.results ?? []).slice(0, MAX_SUGGESTIONS).map(toLocation);
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function toLocation(place: OpenMeteoPlace): Location {
  return {
    id: String(place.id),
    name: place.name,
    country: place.country ?? countryNames.of(place.country_code) ?? place.country_code,
    countryCode: place.country_code,
    region: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}
