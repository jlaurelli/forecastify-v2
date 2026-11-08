import Anthropic from "@anthropic-ai/sdk";
import type { Location } from "@/locations/location";
import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";
import { labelSuggestions } from "@/locations/labelSuggestions";
import { conversationTools } from "./conversationTools";
import { describeForecast } from "./describeForecast";
import type { Turn } from "./turn";


type Options = {
  client: Anthropic;
  earlierTurns: Turn[];
  question: string;
  forecast: Forecast;
  unitSystem: UnitSystem;
  searchLocations: (query: string) => Promise<Location[]>;
  getForecast: (location: Location) => Promise<Forecast>;
};

const SYSTEM_PROMPT = `You are the weather agent in Forecastify. The user has selected one place, the Selected Location, and is looking at its seven-day Forecast. Each of their messages includes that Forecast as JSON, followed by their question.

Answer questions about the weather in plain, friendly language, briefly. Use the units in the Forecast you were given; never convert them.

You only know the seven days in the Forecast. If asked about anything later, or about past or typical weather, say you can only see the coming week.

To compare with another place, use search_locations, then get_forecast with one of its location_ids. If the name matches more than one plausible place (for example, Springfield in Illinois and in Missouri), ask the user which one they mean instead of guessing.

Give a Forecast Brief, a short summary of the whole week, only when the user asks for one.

If a question is not about weather, politely say you can only help with the weather.`;

export class AnswerUnavailable extends Error {
  constructor(options?: ErrorOptions) {
    super("Answer unavailable", options);
    this.name = "AnswerUnavailable";
  }
}

/** Answers a question in the Conversation, yielding the answer's text as it streams. */
export async function* answerQuestion({
  client,
  earlierTurns,
  question,
  forecast,
  unitSystem,
  searchLocations,
  getForecast,
}: Options): AsyncGenerator<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...earlierTurns.flatMap((turn): Anthropic.Beta.BetaMessageParam[] => [
      { role: "user", content: userMessage(turn.question, turn.forecast, turn.unitSystem) },
      { role: "assistant", content: turn.answer },
    ]),
    { role: "user", content: userMessage(question, forecast, unitSystem) },
  ];

  const runner = client.beta.messages.toolRunner({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    tools: conversationTools({ unitSystem, searchLocations, getForecast }),
    messages,
    stream: true,
  });

  try {
    for await (const stream of runner) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
      const message = await stream.finalMessage();
      // Declined even after any fallback model was tried.
      if (message.stop_reason === "refusal") throw new AnswerUnavailable();
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) throw new AnswerUnavailable({ cause: error });
    throw error;
  }
}

// Rebuilt identically for every turn, so earlier turns never change when resent.
function userMessage(question: string, forecast: Forecast, unitSystem: UnitSystem) {
  const name = labelSuggestions([forecast.location])[0];
  const selected = JSON.stringify(describeForecast(name, forecast, unitSystem));
  return `Selected Location's Forecast:\n${selected}\n\nQuestion: ${question}`;
}
