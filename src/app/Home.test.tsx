import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Forecast } from "@/forecast/forecast";
import { ForecastUnavailable } from "@/forecast/getForecast";
import { Home } from "./Home";
import { forecastFor, portland, portlandMaine, selectLocation } from "./homeFixtures";

const renderHome = () =>
  render(
    <Home
      searchLocations={async () => [portland]}
      getForecast={async (location) => forecastFor(location)}
    />,
  );

const browserLocale = (locale: string) =>
  vi.spyOn(navigator, "language", "get").mockReturnValue(locale);

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Home", () => {
  it("shows the Selected Location's seven Forecast Days", async () => {
    const user = userEvent.setup();
    render(
      <Home
        searchLocations={async () => [portland]}
        getForecast={async (location) => forecastFor(location)}
      />,
    );

    await selectLocation(user, "Portland, Oregon, United States");

    const forecast = await screen.findByRole("list", { name: /forecast/i });
    const days = within(forecast).getAllByRole("listitem");
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveTextContent("Today");
    expect(days[0]).toHaveTextContent("Rain");
    expect(days[0]).toHaveTextContent("74%");
    expect(days[1]).toHaveTextContent("Fri");
  });

  it("starts in the Unit System for the browser's locale", async () => {
    browserLocale("en-US");
    const user = userEvent.setup();
    renderHome();

    await selectLocation(user, "Portland, Oregon, United States");

    const [today] = within(await screen.findByRole("list", { name: /forecast/i })).getAllByRole("listitem");
    expect(today).toHaveTextContent("58° / 48°");
    expect(today).toHaveTextContent("19 mph");
  });

  it("lets the user switch Unit System", async () => {
    browserLocale("en-US");
    const user = userEvent.setup();
    renderHome();

    await selectLocation(user, "Portland, Oregon, United States");
    await user.click(screen.getByRole("radio", { name: /°C/ }));

    const [today] = within(screen.getByRole("list", { name: /forecast/i })).getAllByRole("listitem");
    expect(today).toHaveTextContent("15° / 9°");
    expect(today).toHaveTextContent("31 km/h");
  });

  it("remembers the user's Unit System for their next visit", async () => {
    browserLocale("en-US");
    const user = userEvent.setup();
    const firstVisit = renderHome();
    await selectLocation(user, "Portland, Oregon, United States");
    await user.click(screen.getByRole("radio", { name: /°C/ }));
    firstVisit.unmount();

    renderHome();
    await selectLocation(user, "Portland, Oregon, United States");

    expect(await screen.findByRole("radio", { name: /°C/ })).toBeChecked();
  });

  it("tells the user when the Forecast is unavailable", async () => {
    const user = userEvent.setup();
    render(
      <Home
        searchLocations={async () => [portland]}
        getForecast={async () => {
          throw new ForecastUnavailable();
        }}
      />,
    );

    await selectLocation(user, "Portland, Oregon, United States");

    expect(await screen.findByRole("alert")).toHaveTextContent(/forecast.*unavailable/i);
  });

  it("shows the newly Selected Location's Forecast even if the previous one arrives later", async () => {
    browserLocale("en-GB");
    let releaseOregon!: () => void;
    const oregonForecast = new Promise<Forecast>((resolve) => {
      releaseOregon = () => resolve(forecastFor(portland));
    });
    const maineForecast = forecastFor(portlandMaine);
    maineForecast.days[0].highC = 3;
    const user = userEvent.setup();
    render(
      <Home
        searchLocations={async () => [portland, portlandMaine]}
        getForecast={(location) =>
          location === portland ? oregonForecast : Promise.resolve(maineForecast)
        }
      />,
    );

    await selectLocation(user, "Portland, Oregon, United States");
    await selectLocation(user, "Portland, Maine, United States");
    await screen.findByRole("list", { name: /forecast/i });
    await act(async () => {
      releaseOregon();
      await oregonForecast;
    });

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Portland, Maine");
    const [today] = within(screen.getByRole("list", { name: /forecast/i })).getAllByRole("listitem");
    expect(today).toHaveTextContent("3° / 9°");
  });

  it("shows that the Forecast is loading", async () => {
    const user = userEvent.setup();
    render(
      <Home
        searchLocations={async () => [portland]}
        getForecast={() => new Promise<Forecast>(() => {})}
      />,
    );

    await selectLocation(user, "Portland, Oregon, United States");

    expect(screen.getByRole("status")).toHaveTextContent(/loading forecast/i);
  });
});
