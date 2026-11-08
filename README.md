# Forecastify

An agentic weather app: find a place and see its upcoming weather, with Claude as the agent. Successor to the original "forecastify".

The domain language — Location, Suggestion, Forecast, Conversation and the rest — is defined in [GLOSSARY.md](GLOSSARY.md).

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

Weather and place data come from [Open-Meteo](https://open-meteo.com/), and Radar from [RainViewer](https://www.rainviewer.com/) on a [Stadia Maps](https://stadiamaps.com/) base map; none needs an API key locally. RainViewer's free API is for personal and educational use only, and before deploying, the site's domain must be registered on a (free, non-commercial) Stadia account. The agent needs a Claude API key:

```bash
cp .env.example .env   # then set ANTHROPIC_API_KEY
```

Without a key, Location Search and the Forecast still work; the page leaves out the Conversation.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the tests once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run eval` | Check the agent's behaviour against the real Claude API (costs money; not part of `npm test`) |
