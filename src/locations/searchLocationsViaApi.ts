import type { Location } from "./location";
import { LocationSearchFailed } from "./searchLocations";

/** Location Search from the browser, through this app's /api/locations route. */
export async function searchLocationsViaApi(query: string): Promise<Location[]> {
  let response: Response;
  try {
    response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
  } catch (cause) {
    throw new LocationSearchFailed({ cause });
  }
  if (!response.ok) throw new LocationSearchFailed();
  return response.json();
}
