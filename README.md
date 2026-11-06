# Foreclaustify

An agentic weather app: find a place and see its upcoming weather, with Claude as the agent. Successor to the original "forecastify".

The domain language — Location, Suggestion, Forecast, Conversation and the rest — is defined in [GLOSSARY.md](GLOSSARY.md).

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

Weather and place data come from [Open-Meteo](https://open-meteo.com/), which needs no API key. The agent needs a Claude API key:

```bash
cp .env.example .env   # then set ANTHROPIC_API_KEY
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the tests once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run eval` | Check the agent's behaviour against the real Claude API (costs money; not part of `npm test`) |
