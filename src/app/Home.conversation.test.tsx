import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskFailed, type AskAgent } from "@/conversation/askAgent";
import { Home } from "./Home";
import { forecastFor, portland, portlandMaine, selectLocation } from "./homeFixtures";

async function* streamOf(...pieces: string[]) {
  for (const piece of pieces) yield piece;
}

const renderHome = (askAgent: AskAgent) =>
  render(
    <Home
      searchLocations={async () => [portland, portlandMaine]}
      getForecast={async (location) => forecastFor(location)}
      askAgent={askAgent}
    />,
  );

async function askQuestion(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(await screen.findByRole("textbox", { name: /ask about the weather/i }), question);
  await user.click(screen.getByRole("button", { name: /^ask$/i }));
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Home Conversation", () => {
  it("shows the agent's answer to a question about the Selected Location", async () => {
    const user = userEvent.setup();
    renderHome(() => streamOf("Yes, a 74% ", "chance of rain."));

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");

    const conversation = screen.getByRole("log", { name: /conversation/i });
    expect(conversation).toHaveTextContent("Will it rain today?");
    expect(await screen.findByText("Yes, a 74% chance of rain.")).toBeInTheDocument();
  });

  it("continues the Conversation when the same Location is selected again", async () => {
    const user = userEvent.setup();
    renderHome(() => streamOf("Yes."));

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");
    await screen.findByText("Yes.");
    await selectLocation(user, "Portland, Oregon, United States");

    expect(await screen.findByRole("log", { name: /conversation/i })).toHaveTextContent(
      "Will it rain today?",
    );
  });

  it("discards the Conversation when a different Location is selected", async () => {
    const user = userEvent.setup();
    renderHome(() => streamOf("Yes."));

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");
    await screen.findByText("Yes.");
    await selectLocation(user, "Portland, Maine, United States");

    expect(await screen.findByRole("log", { name: /conversation/i })).not.toHaveTextContent(
      "Will it rain today?",
    );
  });

  it("gives the agent the earlier turns of the Conversation", async () => {
    const user = userEvent.setup();
    const askAgent = vi.fn<AskAgent>(() => streamOf("Yes."));
    renderHome(askAgent);

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");
    await screen.findByText("Yes.");
    await askQuestion(user, "And tomorrow?");

    await vi.waitFor(() => expect(askAgent).toHaveBeenCalledTimes(2));
    expect(askAgent.mock.calls[1][0]).toMatchObject({
      question: "And tomorrow?",
      earlierTurns: [{ question: "Will it rain today?", answer: "Yes." }],
    });
  });

  it("asks for a Forecast Brief from the shortcut", async () => {
    const user = userEvent.setup();
    const askAgent = vi.fn<AskAgent>(() => streamOf("A wet week ahead."));
    renderHome(askAgent);

    await selectLocation(user, "Portland, Oregon, United States");
    await user.click(await screen.findByRole("button", { name: /brief me/i }));

    expect(await screen.findByText("A wet week ahead.")).toBeInTheDocument();
    expect(askAgent.mock.calls[0][0].question).toMatch(/forecast brief/i);
    expect(screen.getByRole("log", { name: /conversation/i })).toHaveTextContent(/forecast brief/i);
  });

  it("tells the user when the agent can't answer, and leaves the question out of the Conversation", async () => {
    const user = userEvent.setup();
    const askAgent = vi
      .fn<AskAgent>()
      .mockImplementationOnce(async function* () {
        yield "Partial ans";
        throw new AskFailed();
      })
      .mockImplementation(() => streamOf("Yes."));
    renderHome(askAgent);

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t answer/i);
    expect(screen.queryByText(/partial ans/i)).not.toBeInTheDocument();

    await askQuestion(user, "Will it rain today?");
    await screen.findByText("Yes.");
    expect(askAgent.mock.calls[1][0].earlierTurns).toEqual([]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("waits for the current answer before taking another question", async () => {
    const user = userEvent.setup();
    renderHome(async function* () {
      yield "Thinking";
      await new Promise(() => {});
    });

    await selectLocation(user, "Portland, Oregon, United States");
    await askQuestion(user, "Will it rain today?");
    await screen.findByText("Thinking");

    expect(screen.getByRole("button", { name: /^ask$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /brief me/i })).toBeDisabled();
  });

  it("waits for the Forecast before taking questions", async () => {
    const user = userEvent.setup();
    render(
      <Home
        searchLocations={async () => [portland]}
        getForecast={() => new Promise(() => {})}
        askAgent={() => streamOf("Yes.")}
      />,
    );

    await selectLocation(user, "Portland, Oregon, United States");

    expect(screen.getByRole("button", { name: /^ask$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /brief me/i })).toBeDisabled();
  });
});
