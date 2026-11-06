import type { Location } from "./location";

const ALWAYS_SHOW_REGION = new Set(["US", "CA"]);

/** How each Suggestion is named to the user, in the same order. */
export function labelSuggestions(suggestions: Location[]): string[] {
  const sameNameInCountry = (a: Location, b: Location) =>
    a !== b && a.name === b.name && a.countryCode === b.countryCode;

  return suggestions.map((location) => {
    const showRegion =
      ALWAYS_SHOW_REGION.has(location.countryCode) ||
      suggestions.some((other) => sameNameInCountry(location, other));
    return [location.name, showRegion && location.region, location.country]
      .filter(Boolean)
      .join(", ");
  });
}
