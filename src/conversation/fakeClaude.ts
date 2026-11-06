/**
 * Test helper: a fake Claude API at the HTTP boundary. Each call to the
 * Messages API gets the next scripted reply, streamed as server-sent events.
 */
type ScriptedBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: object };

export type ScriptedReply =
  | { blocks: ScriptedBlock[]; stopReason?: "end_turn" | "tool_use" | "refusal" }
  | { status: number };

export function fakeClaude(replies: ScriptedReply[]) {
  const requests: { body: { messages: unknown[] } & Record<string, unknown> }[] = [];

  const fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ body: JSON.parse(String(init?.body)) });
    const reply = replies.shift();
    if (!reply) throw new Error("fakeClaude: no reply scripted for this request");
    if ("status" in reply) {
      return new Response(JSON.stringify({ type: "error", error: { type: "api_error", message: "boom" } }), {
        status: reply.status,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(toEventStream(reply.blocks, reply.stopReason), {
      headers: { "content-type": "text/event-stream" },
    });
  };

  return { fetch: fetch as typeof globalThis.fetch, requests };
}

function toEventStream(blocks: ScriptedBlock[], stopReason?: string) {
  const events: [string, object][] = [
    [
      "message_start",
      {
        type: "message_start",
        message: {
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-opus-5-5",
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      },
    ],
  ];
  blocks.forEach((block, index) => {
    if (block.type === "text") {
      events.push(["content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } }]);
      // Split the text so the stream carries more than one delta.
      for (const piece of block.text.match(/[\s\S]{1,8}/g) ?? []) {
        events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text: piece } }]);
      }
    } else {
      events.push([
        "content_block_start",
        { type: "content_block_start", index, content_block: { type: "tool_use", id: block.id, name: block.name, input: {} } },
      ]);
      events.push([
        "content_block_delta",
        { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(block.input) } },
      ]);
    }
    events.push(["content_block_stop", { type: "content_block_stop", index }]);
  });
  const finalStop = stopReason ?? (blocks.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn");
  events.push([
    "message_delta",
    { type: "message_delta", delta: { stop_reason: finalStop, stop_sequence: null }, usage: { output_tokens: 20 } },
  ]);
  events.push(["message_stop", { type: "message_stop" }]);

  return events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}
