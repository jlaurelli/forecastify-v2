import { describe, expect, it } from "vitest";
import { defaultUnitSystem } from "./unitSystem";

describe("defaultUnitSystem", () => {
  it.each(["en-US", "es-US", "es-PR", "en-GU", "en-VI", "en-AS", "en-MP"])(
    "is imperial in the US and its territories (%s)",
    (locale) => {
      expect(defaultUnitSystem(locale)).toBe("imperial");
    },
  );

  it.each(["en-GB", "fr-CA", "en-CA", "de-DE", "en", "", "not a locale"])(
    "is metric everywhere else (%j)",
    (locale) => {
      expect(defaultUnitSystem(locale)).toBe("metric");
    },
  );
});
