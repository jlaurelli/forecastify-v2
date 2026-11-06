import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Location } from "./location";
import { LocationSearch } from "./LocationSearch";
import { LocationSearchFailed } from "./searchLocations";

const portlandOregon: Location = {
  id: "5746545",
  name: "Portland",
  country: "United States",
  countryCode: "US",
  region: "Oregon",
  latitude: 45.52,
  longitude: -122.68,
  timezone: "America/Los_Angeles",
};

const portlandMaine: Location = {
  ...portlandOregon,
  id: "4975802",
  region: "Maine",
  latitude: 43.66,
  longitude: -70.26,
  timezone: "America/New_York",
};

describe("LocationSearch", () => {
  it("lets the user pick a Suggestion as the Selected Location", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <LocationSearch
        search={async () => [portlandOregon, portlandMaine]}
        onSelect={onSelect}
      />,
    );

    await user.type(screen.getByRole("combobox", { name: /location/i }), "Portl");
    await user.click(
      await screen.findByRole("option", { name: "Portland, Maine, United States" }),
    );

    expect(onSelect).toHaveBeenCalledWith(portlandMaine);
  });

  it("tells the user when no Location matches", async () => {
    const user = userEvent.setup();
    render(<LocationSearch search={async () => []} onSelect={vi.fn()} />);

    await user.type(screen.getByRole("combobox", { name: /location/i }), "Xyzzy");

    expect(await screen.findByText(/no places match/i)).toBeInTheDocument();
  });

  it("does not claim no match before the user has typed enough to search", async () => {
    const user = userEvent.setup();
    const search = vi.fn(async () => []);
    render(<LocationSearch search={search} onSelect={vi.fn()} />);

    await user.type(screen.getByRole("combobox", { name: /location/i }), "X");
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith("X"));

    expect(screen.queryByText(/no places match/i)).not.toBeInTheDocument();
  });

  it("tells the user when the Location Search fails", async () => {
    const user = userEvent.setup();
    render(
      <LocationSearch
        search={async () => {
          throw new LocationSearchFailed();
        }}
        onSelect={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("combobox", { name: /location/i }), "Portl");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t search/i);
    expect(screen.queryByText(/no places match/i)).not.toBeInTheDocument();
  });
});
