"use client";

import { useEffect, useId, useState } from "react";
import type { Location } from "./location";
import { labelSuggestions } from "./labelSuggestions";
import { MIN_QUERY_LENGTH } from "./searchLocations";

const DEBOUNCE_MS = 250;

type Props = {
  search: (query: string) => Promise<Location[]>;
  onSelect: (location: Location) => void;
};

export function LocationSearch({ search, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    query: string;
    suggestions: Location[];
    failed?: boolean;
  }>({ query: "", suggestions: [] });
  const listId = useId();

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const suggestions = await search(query);
        if (!stale) setResult({ query, suggestions });
      } catch {
        if (!stale) setResult({ query, suggestions: [], failed: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, search]);

  const { suggestions } = result;
  const labels = labelSuggestions(suggestions);
  const noMatch =
    !result.failed &&
    result.query.trim().length >= MIN_QUERY_LENGTH && suggestions.length === 0;

  return (
    <div>
      <input
        role="combobox"
        aria-label="Search for a location"
        aria-controls={listId}
        aria-expanded={suggestions.length > 0}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul id={listId} role="listbox">
        {suggestions.map((location, i) => (
          <li
            key={location.id}
            role="option"
            aria-selected={false}
            onClick={() => onSelect(location)}
          >
            {labels[i]}
          </li>
        ))}
      </ul>
      {result.failed && (
        <p role="alert">Couldn’t search for places right now. Please try again.</p>
      )}
      {noMatch && <p>No places match “{result.query.trim()}”.</p>}
    </div>
  );
}
