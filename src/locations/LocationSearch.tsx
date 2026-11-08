"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  // Bumped by each new search and by picking a Suggestion, so a search still
  // running when a Suggestion is picked can't reopen the list.
  const latestSearch = useRef(0);

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(async () => {
      const thisSearch = ++latestSearch.current;
      const isLatest = () => !stale && thisSearch === latestSearch.current;
      try {
        const suggestions = await search(query);
        if (isLatest()) setResult({ query, suggestions });
      } catch {
        if (isLatest()) setResult({ query, suggestions: [], failed: true });
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
    <div className="location-search">
      <input
        className="form-control"
        role="combobox"
        aria-label="Search for a location"
        placeholder="Lancaster, PA"
        aria-controls={listId}
        aria-expanded={suggestions.length > 0}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul id={listId} role="listbox" className="suggestions">
        {suggestions.map((location, i) => (
          <li
            key={location.id}
            role="option"
            aria-selected={false}
            onClick={() => {
              latestSearch.current++;
              setResult({ query: "", suggestions: [] });
              onSelect(location);
            }}
          >
            {labels[i]}
          </li>
        ))}
      </ul>
      {result.failed && (
        <p role="alert" className="alert">Couldn’t search for places right now. Please try again.</p>
      )}
      {noMatch && <p className="notice">No places match “{result.query.trim()}”.</p>}
    </div>
  );
}
