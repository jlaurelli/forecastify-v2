import type { Location } from "@/locations/location";
import { ForecastUnavailable, getForecast } from "@/forecast/getForecast";

export async function POST(request: Request) {
  const location = await request.json().catch(() => null);
  if (!isLocation(location)) {
    return Response.json({ error: "Expected a Location" }, { status: 400 });
  }
  try {
    return Response.json(await getForecast(location));
  } catch (error) {
    if (error instanceof ForecastUnavailable) {
      return Response.json({ error: "Forecast unavailable" }, { status: 502 });
    }
    throw error;
  }
}

function isLocation(value: unknown): value is Location {
  const candidate = value as Partial<Location> | null;
  return (
    typeof candidate?.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.timezone === "string"
  );
}
