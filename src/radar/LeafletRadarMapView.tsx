"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { RadarMapProps } from "./radar";

// RainViewer serves Radar no closer than zoom 7; the base map can go further,
// with the Radar scaled up.
const RADAR_MAX_ZOOM = 7;
const INITIAL_ZOOM = 6;
const RADAR_OPACITY = 0.8;

export default function LeafletRadarMapView({
  latitude,
  longitude,
  frames,
  frameIndex,
}: RadarMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(null);
  // One layer per frame, created on first show and kept, so looping back to a
  // frame reuses its tiles rather than fetching them again.
  const layers = useRef(new Map<string, L.TileLayer>());

  useEffect(() => {
    const created = L.map(container.current!, {
      center: [latitude, longitude],
      zoom: INITIAL_ZOOM,
      maxZoom: 10,
      scrollWheelZoom: false,
    });
    // Stadia needs no key on localhost; a deployed site's domain must be
    // registered on a Stadia account instead.
    L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(created);
    L.circleMarker([latitude, longitude], {
      radius: 6,
      color: "#ffffff",
      weight: 2,
      fillColor: "#28a745",
      fillOpacity: 1,
    }).addTo(created);
    map.current = created;
    const frameLayers = layers.current;
    return () => {
      created.remove();
      map.current = null;
      frameLayers.clear();
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const current = map.current;
    if (!current) return;
    const layerFor = (tileUrl: string) => {
      let layer = layers.current.get(tileUrl);
      if (!layer) {
        layer = L.tileLayer(tileUrl, {
          tileSize: 512,
          zoomOffset: -1,
          maxNativeZoom: RADAR_MAX_ZOOM,
          opacity: 0,
        }).addTo(current);
        layers.current.set(tileUrl, layer);
      }
      return layer;
    };
    const shown = frames[frameIndex].tileUrl;
    // Load the next frame hidden, so it's ready when the loop reaches it.
    layerFor(frames[(frameIndex + 1) % frames.length].tileUrl);
    layerFor(shown);
    for (const [tileUrl, layer] of layers.current) {
      layer.setOpacity(tileUrl === shown ? RADAR_OPACITY : 0);
    }
  }, [frames, frameIndex]);

  return <div ref={container} className="radar-map" />;
}
