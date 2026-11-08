import { describe, expect, it } from "vitest";
import { RadarUnavailable, getRadarFrames } from "./getRadarFrames";

const respondWith = (body: unknown, status = 200): typeof fetch =>
  async () => new Response(JSON.stringify(body), { status });

const weatherMaps = {
  version: "2.0",
  generated: 1794174327,
  host: "https://tilecache.rainviewer.com",
  radar: {
    past: [
      { time: 1794167400, path: "/v2/radar/08888f0371b0" },
      { time: 1794168000, path: "/v2/radar/b6e74dbbc906" },
    ],
    nowcast: [],
  },
  satellite: { infrared: [] },
};

describe("getRadarFrames", () => {
  it("gives the past Radar frames, oldest first, as map tiles", async () => {
    const frames = await getRadarFrames({ fetch: respondWith(weatherMaps) });

    expect(frames).toEqual([
      {
        time: new Date("2026-11-08T19:50:00Z"),
        tileUrl: "https://tilecache.rainviewer.com/v2/radar/08888f0371b0/512/{z}/{x}/{y}/2/1_1.png",
      },
      {
        time: new Date("2026-11-08T20:00:00Z"),
        tileUrl: "https://tilecache.rainviewer.com/v2/radar/b6e74dbbc906/512/{z}/{x}/{y}/2/1_1.png",
      },
    ]);
  });

  it("reports the Radar as unavailable when the provider errors", async () => {
    await expect(getRadarFrames({ fetch: respondWith({}, 503) })).rejects.toBeInstanceOf(
      RadarUnavailable,
    );
  });

  it("reports the Radar as unavailable when the provider is unreachable", async () => {
    const frames = getRadarFrames({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    await expect(frames).rejects.toBeInstanceOf(RadarUnavailable);
  });

  it("reports the Radar as unavailable when there are no frames", async () => {
    const frames = getRadarFrames({
      fetch: respondWith({ ...weatherMaps, radar: { past: [], nowcast: [] } }),
    });

    await expect(frames).rejects.toBeInstanceOf(RadarUnavailable);
  });
});
