// Screenshots the running app in headless Chrome, for checking layout by eye.
//
//   npm run screenshot -- [place] [width]
//
// With a place, it searches for it, picks the first Suggestion and waits for
// the Forecast (and Radar, if it loads) before capturing the full page.
// Without one, it captures the start screen. Needs `npm run dev` running.
//
// Env: BASE_URL (default http://localhost:3000), CHROME (path to Chrome).

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [place = "", widthArg = "1280"] = process.argv.slice(2);
const width = Number(widthArg);
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 600);
const slug = (place || "start").toLowerCase().replace(/[^a-z0-9]+/g, "-");
const out = join("screenshots", `${slug}-${width}.png`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = await mkdtemp(join(tmpdir(), "forecastify-screenshot-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},900`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  const page = await connect();
  await page.send("Page.enable");
  await page.send("Page.navigate", { url: baseUrl });
  // The search box is in the server's HTML; typing only counts once React has
  // hydrated it and attached its handlers.
  await waitFor(
    page,
    `Object.keys(document.querySelector('[role=combobox]') ?? {}).some((key) => key.startsWith('__reactProps'))`,
    "the search box to hydrate",
  );

  if (place) {
    await page.evaluate(`document.querySelector('[role=combobox]').focus()`);
    await page.send("Input.insertText", { text: place });
    await waitFor(page, `!!document.querySelector('[role=option]')`, `a Suggestion for "${place}"`);
    await page.evaluate(`document.querySelector('[role=option]').click()`);
    await waitFor(page, `!!document.querySelector('.forecast-day')`, "the Forecast");
    // The Radar is optional: capture anyway if RainViewer is slow or down.
    await waitFor(
      page,
      `!!document.querySelector('.radar-time, .radar-unavailable')`,
      "the Radar",
    ).catch(() => {});
    await sleep(1500); // let map tiles paint
  }

  const height = await page.evaluate(`document.documentElement.scrollHeight`);
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await sleep(300);
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  await mkdir("screenshots", { recursive: true });
  await writeFile(out, Buffer.from(data, "base64"));
  console.log(out);
  page.close();
} finally {
  // Chrome keeps writing to its profile until it exits.
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill();
  await exited;
  await rm(profile, { recursive: true, force: true, maxRetries: 5 });
}

async function connect() {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      target = targets.find((t) => t.type === "page");
    } catch {
      await sleep(200);
    }
  }
  if (!target) throw new Error(`Chrome didn't start; set CHROME if it isn't at ${chromePath}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) =>
        message.error ? reject(new Error(message.error.message)) : resolve(message.result),
      );
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) =>
    (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }))
      .result.value;
  return { send, evaluate, close: () => ws.close() };
}

async function waitFor(page, condition, what, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.evaluate(condition)) return;
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${what}`);
}
