"use client";

import { useRef, useState, type ComponentType } from "react";
import type { Location } from "@/locations/location";
import { askAgentViaApi, type AskAgent } from "@/conversation/askAgent";
import { ConversationPanel } from "@/conversation/ConversationPanel";
import type { Forecast } from "@/forecast/forecast";
import { ForecastDays } from "@/forecast/ForecastDays";
import { getForecastViaApi } from "@/forecast/getForecastViaApi";
import { UnitSystemToggle } from "@/forecast/UnitSystemToggle";
import type { UnitSystem } from "@/forecast/unitSystem";
import { loadUnitSystem, saveUnitSystem } from "@/forecast/unitSystemPreference";
import { LocationSearch } from "@/locations/LocationSearch";
import { getRadarFrames as getRadarFramesFromRainViewer } from "@/radar/getRadarFrames";
import { LeafletRadarMap } from "@/radar/LeafletRadarMap";
import type { RadarFrame, RadarMapProps } from "@/radar/radar";
import { RadarPanel } from "@/radar/RadarPanel";
import { labelSuggestions } from "@/locations/labelSuggestions";
import { searchLocationsViaApi } from "@/locations/searchLocationsViaApi";

type Props = {
  searchLocations?: (query: string) => Promise<Location[]>;
  getForecast?: (location: Location) => Promise<Forecast>;
  askAgent?: AskAgent;
  conversationAvailable?: boolean;
  getRadarFrames?: () => Promise<RadarFrame[]>;
  RadarMap?: ComponentType<RadarMapProps>;
};

export function Home({
  searchLocations = searchLocationsViaApi,
  getForecast = getForecastViaApi,
  askAgent = askAgentViaApi,
  conversationAvailable = true,
  getRadarFrames = getRadarFramesFromRainViewer,
  RadarMap = LeafletRadarMap,
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [forecast, setForecast] = useState<Forecast | "unavailable">();
  const latestSelection = useRef<Location>(undefined);
  // Units are only ever rendered alongside a Forecast, which never exists on the
  // server, so this can't cause a hydration mismatch.
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() =>
    typeof window === "undefined" ? "metric" : loadUnitSystem(),
  );

  function changeUnitSystem(next: UnitSystem) {
    setUnitSystem(next);
    saveUnitSystem(next);
  }

  async function select(location: Location) {
    latestSelection.current = location;
    setSelectedLocation(location);
    setForecast(undefined);
    let result: Forecast | "unavailable";
    try {
      result = await getForecast(location);
    } catch {
      result = "unavailable";
    }
    // A slower Forecast for an earlier selection must not replace this one.
    if (latestSelection.current === location) setForecast(result);
  }

  const search = <LocationSearch search={searchLocations} onSelect={select} />;

  return (
    <>
      <header className="header">
        <h1 className="header-title">Foreclaustify</h1>
        {selectedLocation && search}
      </header>
      <main className="main-content">
        {!selectedLocation && (
          <div className="prompt">
            <p className="prompt-title">Enter a city</p>
            {search}
          </div>
        )}
        {selectedLocation && (
          <h2 className="subheader">{labelSuggestions([selectedLocation])[0]}</h2>
        )}
        {selectedLocation && !forecast && (
          <p role="status" className="notice">
            Loading forecast…
          </p>
        )}
        {forecast === "unavailable" && (
          <p role="alert" className="alert">
            The forecast is unavailable right now. Please try again.
          </p>
        )}
        {forecast && forecast !== "unavailable" && (
          <>
            <UnitSystemToggle value={unitSystem} onChange={changeUnitSystem} />
            <div className="forecast-layout">
              <ForecastDays forecast={forecast} unitSystem={unitSystem} />
              <RadarPanel
                key={forecast.location.id}
                location={forecast.location}
                getRadarFrames={getRadarFrames}
                RadarMap={RadarMap}
              />
            </div>
          </>
        )}
        {selectedLocation && conversationAvailable && (
          // Keyed by Location: a different Location starts a new Conversation.
          <ConversationPanel
            key={selectedLocation.id}
            forecast={forecast && forecast !== "unavailable" ? forecast : undefined}
            unitSystem={unitSystem}
            askAgent={askAgent}
          />
        )}
      </main>
    </>
  );
}
