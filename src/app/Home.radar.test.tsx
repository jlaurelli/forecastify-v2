import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RadarFrame } from "@/radar/radar";
import { RadarUnavailable } from "@/radar/getRadarFrames";
import { FRAME_MS } from "@/radar/RadarPanel";
import { Home } from "./Home";
import { forecastFor, portland, selectLocation } from "./homeFixtures";

// Portland is on Pacific Standard Time (UTC−8) in November.
const frames: RadarFrame[] = [
  { time: new Date("2026-11-08T19:50:00Z"), tileUrl: "https://tiles.test/1950/{z}/{x}/{y}.png" },
  { time: new Date("2026-11-08T20:00:00Z"), tileUrl: "https://tiles.test/2000/{z}/{x}/{y}.png" },
];

const renderHome = (getRadarFrames: () => Promise<RadarFrame[]>) =>
  render(
    <Home
      searchLocations={async () => [portland]}
      getForecast={async (location) => forecastFor(location)}
      getRadarFrames={getRadarFrames}
      RadarMap={() => null}
    />,
  );

const radar = async () => screen.findByRole("region", { name: /radar/i });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Home Radar", () => {
  it("shows the Radar for the Selected Location at its latest frame, with credit", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome(async () => frames);

    await selectLocation(user, "Portland, Oregon, United States");

    expect(await within(await radar()).findByText("12:00 PM")).toBeInTheDocument();
    expect(within(await radar()).getByRole("link", { name: "RainViewer" })).toHaveAttribute(
      "href",
      "https://www.rainviewer.com/",
    );
  });

  it("plays through the Radar frames on a loop", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome(async () => frames);
    await selectLocation(user, "Portland, Oregon, United States");
    const shown = within(await radar());
    await shown.findByText("12:00 PM");

    await act(async () => vi.advanceTimersByTime(FRAME_MS));
    expect(shown.getByText("11:50 AM")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(FRAME_MS));
    expect(shown.getByText("12:00 PM")).toBeInTheDocument();
  });

  it("stops on the shown frame when paused, and carries on when played", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome(async () => frames);
    await selectLocation(user, "Portland, Oregon, United States");
    const shown = within(await radar());
    await shown.findByText("12:00 PM");

    await user.click(shown.getByRole("button", { name: "Pause" }));
    await act(async () => vi.advanceTimersByTime(FRAME_MS * 3));
    expect(shown.getByText("12:00 PM")).toBeInTheDocument();

    await user.click(shown.getByRole("button", { name: "Play" }));
    await act(async () => vi.advanceTimersByTime(FRAME_MS));
    expect(shown.getByText("11:50 AM")).toBeInTheDocument();
  });

  it("says when the Radar is unavailable, and keeps showing the Forecast", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome(async () => {
      throw new RadarUnavailable();
    });

    await selectLocation(user, "Portland, Oregon, United States");

    expect(await within(await radar()).findByText(/radar is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /forecast/i })).toBeInTheDocument();
    expect(within(await radar()).queryByRole("button")).not.toBeInTheDocument();
  });
});
