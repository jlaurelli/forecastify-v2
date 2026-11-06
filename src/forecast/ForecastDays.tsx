import type { Forecast } from "./forecast";
import { formatForecastDays } from "./formatForecastDays";
import type { UnitSystem } from "./unitSystem";

type Props = { forecast: Forecast; unitSystem: UnitSystem };

export function ForecastDays({ forecast, unitSystem }: Props) {
  return (
    <ol aria-label="7-day forecast">
      {formatForecastDays(forecast, unitSystem).map((day, i) => (
        <li key={forecast.days[i].date}>
          <span>{day.day}</span> <span>{day.condition}</span>{" "}
          <span>
            {day.high} / {day.low}
          </span>{" "}
          <span>{day.precipitationChance}</span> <span>{day.maxWind}</span>
        </li>
      ))}
    </ol>
  );
}
