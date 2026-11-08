"use client";

import dynamic from "next/dynamic";

/** The Radar map, loaded in the browser only: Leaflet needs `window`. */
export const LeafletRadarMap = dynamic(() => import("./LeafletRadarMapView"), {
  ssr: false,
  loading: () => <div className="radar-map" />,
});
