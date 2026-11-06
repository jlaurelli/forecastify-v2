import type { Location } from "@/locations/location";
import type { Forecast } from "./forecast";
import { ForecastUnavailable } from "./getForecast";

/** A Location's Forecast from the browser, through this app's /api/forecast route. */
export async function getForecastViaApi(location: Location): Promise<Forecast> {
  let response: Response;
  try {
    response = await fetch("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });
  } catch (cause) {
    throw new ForecastUnavailable({ cause });
  }
  if (!response.ok) throw new ForecastUnavailable();
  return response.json();
}
