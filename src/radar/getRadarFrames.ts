import type { RadarFrame } from "./radar";

const WEATHER_MAPS_URL = "https://api.rainviewer.com/public/weather-maps.json";
// 512px tiles (a quarter of the requests of 256px, under RainViewer's rate
// limit), the "Universal Blue" scheme (the only one it still offers), smoothed,
// with snow shown in its own colours.
const TILE_OPTIONS = "512/{z}/{x}/{y}/2/1_1.png";

type WeatherMaps = {
  host: string;
  radar: { past: { time: number; path: string }[] };
};

type Options = { fetch?: typeof fetch };

export class RadarUnavailable extends Error {
  constructor(options?: ErrorOptions) {
    super("Radar unavailable", options);
    this.name = "RadarUnavailable";
  }
}

/** The past two hours of Radar from RainViewer, oldest first. */
export async function getRadarFrames({ fetch: fetchFn = fetch }: Options = {}): Promise<
  RadarFrame[]
> {
  let response: Response;
  try {
    response = await fetchFn(WEATHER_MAPS_URL);
  } catch (cause) {
    throw new RadarUnavailable({ cause });
  }
  if (!response.ok) throw new RadarUnavailable();

  const { host, radar }: WeatherMaps = await response.json();
  if (!radar?.past?.length) throw new RadarUnavailable();

  return radar.past.map(({ time, path }) => ({
    time: new Date(time * 1000),
    tileUrl: `${host}${path}/${TILE_OPTIONS}`,
  }));
}
