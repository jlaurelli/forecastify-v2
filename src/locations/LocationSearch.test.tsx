import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

  it("closes the Suggestions once one is picked", async () => {
    const user = userEvent.setup();
    render(
      <LocationSearch search={async () => [portlandOregon, portlandMaine]} onSelect={vi.fn()} />,
    );

    await user.type(screen.getByRole("combobox", { name: /location/i }), "Portl");
    await user.click(
      await screen.findByRole("option", { name: "Portland, Maine, United States" }),
    );

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByRole("combobox", { name: /location/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText(/no places match/i)).not.toBeInTheDocument();
  });

  it("offers Suggestions again when the user types after picking one", async () => {
    const user = userEvent.setup();
    render(
      <LocationSearch search={async () => [portlandOregon, portlandMaine]} onSelect={vi.fn()} />,
    );
    const input = screen.getByRole("combobox", { name: /location/i });

    await user.type(input, "Portl");
    await user.click(
      await screen.findByRole("option", { name: "Portland, Maine, United States" }),
    );
    await user.type(input, "a");

    expect(await screen.findAllByRole("option")).toHaveLength(2);
  });

  it("stays closed when a search that was still running finishes after the pick", async () => {
    const user = userEvent.setup();
    let finishSlowSearch!: () => void;
    const search = vi.fn(async (query: string) => {
      if (query === "Portla") {
        await new Promise<void>((resolve) => (finishSlowSearch = resolve));
      }
      return [portlandOregon, portlandMaine];
    });
    render(<LocationSearch search={search} onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: /location/i });

    await user.type(input, "Portl");
    const maine = await screen.findByRole("option", { name: "Portland, Maine, United States" });
    await user.type(input, "a");
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith("Portla"));
    await user.click(maine);
    await act(async () => finishSlowSearch());

    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});
