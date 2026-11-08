import type { Location } from "@/locations/location";
import type { Condition, Forecast } from "./forecast";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FORECAST_DAYS = 7;

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  uv_index_max: (number | null)[];
};

type Options = { fetch?: typeof fetch };

export class ForecastUnavailable extends Error {
  constructor(options?: ErrorOptions) {
    super("Forecast unavailable", options);
    this.name = "ForecastUnavailable";
  }
}

export async function getForecast(
  location: Location,
  { fetch: fetchFn = fetch }: Options = {},
): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timezone);
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "sunrise",
      "sunset",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "uv_index_max",
    ].join(","),
  );

  let response: Response;
  try {
    response = await fetchFn(url);
  } catch (cause) {
    throw new ForecastUnavailable({ cause });
  }
  if (!response.ok) throw new ForecastUnavailable();

  const { daily }: { daily: OpenMeteoDaily } = await response.json();

  return {
    location,
    days: daily.time.map((date, i) => {
      // Open-Meteo gives midnight for both when the sun neither rises nor sets.
      const sunRisesAndSets = daily.sunrise[i] !== daily.sunset[i];
      return {
        date,
        condition: toCondition(daily.weather_code[i]),
        highC: daily.temperature_2m_max[i],
        lowC: daily.temperature_2m_min[i],
        precipitationChance: daily.precipitation_probability_max[i],
        maxWindKmh: daily.wind_speed_10m_max[i],
        sunrise: sunRisesAndSets ? timeOfDay(daily.sunrise[i]) : null,
        sunset: sunRisesAndSets ? timeOfDay(daily.sunset[i]) : null,
        feelsLikeHighC: daily.apparent_temperature_max[i],
        feelsLikeLowC: daily.apparent_temperature_min[i],
        uvIndex: daily.uv_index_max[i],
      };
    }),
  };
}

/** "2026-11-05T06:55" → "06:55", already local to the Location. */
const timeOfDay = (dateTime: string) => dateTime.slice(dateTime.indexOf("T") + 1);

const CONDITION_CODES: [Condition, number[]][] = [
  ["Clear", [0, 1]],
  ["Partly cloudy", [2]],
  ["Cloudy", [3]],
  ["Fog", [45, 48]],
  ["Drizzle", [51, 53, 55, 56, 57]],
  ["Rain", [61, 63, 65, 66, 67, 80, 81, 82]],
  ["Snow", [71, 73, 75, 77, 85, 86]],
  ["Thunderstorm", [95, 96, 99]],
];

const CONDITION_BY_CODE = new Map(
  CONDITION_CODES.flatMap(([condition, codes]) =>
    codes.map((code) => [code, condition] as const),
  ),
);

function toCondition(code: number): Condition {
  const condition = CONDITION_BY_CODE.get(code);
  if (!condition) {
    throw new ForecastUnavailable({ cause: new Error(`Unknown weather code ${code}`) });
  }
  return condition;
}
