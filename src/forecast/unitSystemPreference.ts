import { defaultUnitSystem, type UnitSystem } from "./unitSystem";

const STORAGE_KEY = "foreclaustify:unit-system";

/** The user's remembered Unit System, or the default for their browser locale. */
export function loadUnitSystem(): UnitSystem {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "metric" || stored === "imperial") return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked site data); fall back to the default.
  }
  return defaultUnitSystem(navigator.language);
}

export function saveUnitSystem(unitSystem: UnitSystem) {
  try {
    localStorage.setItem(STORAGE_KEY, unitSystem);
  } catch {
    // Not remembering is acceptable; the choice still applies for this visit.
  }
}
