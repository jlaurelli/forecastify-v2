"use client";

import { useState, type FormEvent } from "react";
import type { Forecast } from "@/forecast/forecast";
import type { UnitSystem } from "@/forecast/unitSystem";
import type { AskAgent } from "./askAgent";
import type { Turn } from "./turn";

const BRIEF_REQUEST = "Give me a Forecast Brief for the week.";

type Props = {
  /** The Selected Location's Forecast; undefined while it is loading. */
  forecast?: Forecast;
  unitSystem: UnitSystem;
  askAgent: AskAgent;
};

export function ConversationPanel({ forecast, unitSystem, askAgent }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<{ question: string; answer: string }>();
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);

  async function ask(question: string) {
    if (!forecast || pending) return;
    setDraft("");
    setFailed(false);
    setPending({ question, answer: "" });
    let answer = "";
    try {
      for await (const piece of askAgent({ earlierTurns: turns, question, forecast, unitSystem })) {
        answer += piece;
        setPending({ question, answer });
      }
    } catch {
      // A partial answer is dropped: only complete turns join the Conversation.
      setFailed(true);
      setPending(undefined);
      return;
    }
    setTurns((earlier) => [...earlier, { question, forecast, unitSystem, answer }]);
    setPending(undefined);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim()) ask(draft.trim());
  }

  const shown = pending ? [...turns, pending] : turns;
  const canAsk = Boolean(forecast) && !pending;

  return (
    <section className="weather-panel conversation">
      <div role="log" aria-label="Conversation" className="conversation-log">
        {shown.map((turn, i) => (
          <div key={i}>
            <p className="question">{turn.question}</p>
            <p>{turn.answer}</p>
          </div>
        ))}
      </div>
      {failed && <p role="alert" className="alert">The agent couldn’t answer that just now. Please try again.</p>}
      <form onSubmit={submit} className="ask-form">
        <input
          className="form-control"
          aria-label="Ask about the weather"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn-success" disabled={!canAsk}>
          Ask
        </button>
      </form>
      <button type="button" className="btn-success" disabled={!canAsk} onClick={() => ask(BRIEF_REQUEST)}>
        Brief me
      </button>
    </section>
  );
}
