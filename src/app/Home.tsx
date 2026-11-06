"use client";

import { useState } from "react";
import type { Location } from "@/locations/location";
import { LocationSearch } from "@/locations/LocationSearch";
import { labelSuggestions } from "@/locations/labelSuggestions";
import { searchLocationsViaApi } from "@/locations/searchLocationsViaApi";

export function Home() {
  const [selectedLocation, setSelectedLocation] = useState<Location>();

  return (
    <main>
      <h1>Foreclaustify</h1>
      <LocationSearch search={searchLocationsViaApi} onSelect={setSelectedLocation} />
      {selectedLocation && <h2>{labelSuggestions([selectedLocation])[0]}</h2>}
    </main>
  );
}
