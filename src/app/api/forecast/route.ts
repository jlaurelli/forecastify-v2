import { ForecastUnavailable, getForecast } from "@/forecast/getForecast";
import { locationSchema } from "@/locations/location";

export async function POST(request: Request) {
  const parsed = locationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Expected a Location" }, { status: 400 });
  }
  try {
    return Response.json(await getForecast(parsed.data));
  } catch (error) {
    if (error instanceof ForecastUnavailable) {
      return Response.json({ error: "Forecast unavailable" }, { status: 502 });
    }
    throw error;
  }
}
