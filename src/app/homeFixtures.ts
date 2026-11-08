import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import { forecastDay } from "@/forecast/forecastFixtures";

export const portland: Location = {
  id: "5746545",
  name: "Portland",
  country: "United States",
  countryCode: "US",
  region: "Oregon",
  latitude: 45.52,
  longitude: -122.68,
  timezone: "America/Los_Angeles",
};

export const portlandMaine: Location = {
  ...portland,
  id: "4975802",
  region: "Maine",
  latitude: 43.66,
  longitude: -70.26,
  timezone: "America/New_York",
};

const dates = [
  "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
  "2026-11-09", "2026-11-10", "2026-11-11",
];

export const forecastFor = (location: Location): Forecast => ({
  location,
  days: dates.map((date) => forecastDay({ date })),
});

export async function selectLocation(user: ReturnType<typeof userEvent.setup>, label: string) {
  const search = screen.getByRole("combobox", { name: /location/i });
  await user.clear(search);
  await user.type(search, "Portl");
  await user.click(await screen.findByRole("option", { name: label }));
}
