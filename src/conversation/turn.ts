import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";

/** One question and answer in a Conversation, with what the agent was shown at the time. */
export type Turn = {
  question: string;
  forecast: Forecast;
  unitSystem: UnitSystem;
  answer: string;
};
