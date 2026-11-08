import { Suspense } from "react";
import { connection } from "next/server";
import { Home } from "./Home";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeForThisServer />
    </Suspense>
  );
}

async function HomeForThisServer() {
  // Read the environment per request, not at build time.
  await connection();
  return <Home conversationAvailable={Boolean(process.env.ANTHROPIC_API_KEY)} />;
}
