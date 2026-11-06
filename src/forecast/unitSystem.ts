export type UnitSystem = "metric" | "imperial";

const IMPERIAL_REGIONS = new Set(["US", "PR", "GU", "VI", "AS", "MP", "UM"]);

/** The Unit System to start with for a browser locale such as "en-US". */
export function defaultUnitSystem(locale: string): UnitSystem {
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).region;
  } catch {
    return "metric";
  }
  return region && IMPERIAL_REGIONS.has(region) ? "imperial" : "metric";
}
