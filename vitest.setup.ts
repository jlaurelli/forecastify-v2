import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Tests inject their own fetch; anything left reaching for the real one (such
// as a component's default data source) fails rather than going online.
beforeEach(() => {
  vi.stubGlobal("fetch", async () => {
    throw new Error("Tests must not reach the network");
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
