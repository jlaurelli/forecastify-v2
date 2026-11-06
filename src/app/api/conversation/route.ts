import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AnswerUnavailable, answerQuestion } from "@/conversation/answerQuestion";
import { getForecast } from "@/forecast/getForecast";
import { searchLocations } from "@/locations/searchLocations";

const location = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
});

const forecast = z.object({
  location,
  days: z.array(
    z.object({
      date: z.string(),
      condition: z.enum(["Clear", "Partly cloudy", "Cloudy", "Fog", "Drizzle", "Rain", "Snow", "Thunderstorm"]),
      highC: z.number(),
      lowC: z.number(),
      precipitationChance: z.number().nullable(),
      maxWindKmh: z.number(),
    }),
  ),
});

const unitSystem = z.enum(["metric", "imperial"]);
const question = z.string().trim().min(1).max(1000);

const askRequest = z.object({
  earlierTurns: z
    .array(z.object({ question, forecast, unitSystem, answer: z.string() }))
    .max(50),
  question,
  forecast,
  unitSystem,
});

const client = new Anthropic();

export async function POST(request: Request) {
  const parsed = askRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Expected a question about a Forecast" }, { status: 400 });
  }

  const answer = answerQuestion({ client, searchLocations, getForecast, ...parsed.data });

  // Wait for the start of the answer, so an immediate failure gets a proper status.
  let first: IteratorResult<string>;
  try {
    first = await answer.next();
  } catch (error) {
    if (error instanceof AnswerUnavailable) {
      return Response.json({ error: "Answer unavailable" }, { status: 502 });
    }
    throw error;
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      if (first.done) controller.close();
      else controller.enqueue(encoder.encode(first.value));
    },
    async pull(controller) {
      try {
        const next = await answer.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        // The browser sees an aborted stream and reports the answer as failed.
        controller.error(error);
      }
    },
    async cancel() {
      await answer.return(undefined);
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
