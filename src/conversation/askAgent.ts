import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";
import type { Turn } from "./turn";

export type AskRequest = {
  earlierTurns: Turn[];
  question: string;
  forecast: Forecast;
  unitSystem: UnitSystem;
};

/** Asks the agent a question in the Conversation; yields the answer's text as it streams. */
export type AskAgent = (request: AskRequest) => AsyncIterable<string>;

export class AskFailed extends Error {
  constructor(options?: ErrorOptions) {
    super("The agent could not answer", options);
    this.name = "AskFailed";
  }
}

/** AskAgent from the browser, through this app's /api/conversation route. */
export async function* askAgentViaApi(request: AskRequest): AsyncGenerator<string> {
  let response: Response;
  try {
    response = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (cause) {
    throw new AskFailed({ cause });
  }
  if (!response.ok || !response.body) throw new AskFailed();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } catch (cause) {
    // The route aborts the stream if the agent fails part-way through.
    throw new AskFailed({ cause });
  }
}
