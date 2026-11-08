"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { Location } from "@/locations/location";
import type { RadarFrame, RadarMapProps } from "./radar";

/** How long each Radar frame is shown while playing. */
export const FRAME_MS = 500;

type Props = {
  location: Location;
  getRadarFrames: () => Promise<RadarFrame[]>;
  RadarMap: ComponentType<RadarMapProps>;
};

export function RadarPanel({ location, getRadarFrames, RadarMap }: Props) {
  const [frames, setFrames] = useState<RadarFrame[] | "unavailable">();
  // Starts at the latest frame; undefined until frames arrive.
  const [shownIndex, setShownIndex] = useState<number>();
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    let stale = false;
    getRadarFrames().then(
      (loaded) => {
        if (stale) return;
        setFrames(loaded);
        setShownIndex(loaded.length - 1);
      },
      () => {
        if (!stale) setFrames("unavailable");
      },
    );
    return () => {
      stale = true;
    };
  }, [getRadarFrames]);

  const frameCount = Array.isArray(frames) ? frames.length : 0;
  useEffect(() => {
    if (!playing || frameCount === 0) return;
    const timer = setInterval(
      () => setShownIndex((index) => ((index ?? 0) + 1) % frameCount),
      FRAME_MS,
    );
    return () => clearInterval(timer);
  }, [playing, frameCount]);

  // Radar times are shown in the Location's own time, like sunrise and sunset.
  const clock = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: location.timezone,
  });
  const frameIndex = shownIndex ?? 0;

  return (
    <section className="weather-panel radar" aria-label="Radar">
      {frames === "unavailable" && (
        <p className="radar-unavailable">The Radar is unavailable right now.</p>
      )}
      {Array.isArray(frames) && (
        <>
          <RadarMap
            latitude={location.latitude}
            longitude={location.longitude}
            frames={frames}
            frameIndex={frameIndex}
          />
          <div className="radar-controls">
            <button type="button" className="btn-success" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
            <p className="radar-time">{clock.format(frames[frameIndex].time)}</p>
          </div>
        </>
      )}
      <p className="radar-credit">
        Weather data by{" "}
        <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">
          RainViewer
        </a>
      </p>
    </section>
  );
}
