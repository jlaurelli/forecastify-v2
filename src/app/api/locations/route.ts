import { LocationSearchFailed, searchLocations } from "@/locations/searchLocations";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return Response.json(await searchLocations(query));
  } catch (error) {
    if (error instanceof LocationSearchFailed) {
      return Response.json({ error: "Location Search failed" }, { status: 502 });
    }
    throw error;
  }
}
