import { ConditionIcon } from "./ConditionIcon";
import type { Forecast } from "./forecast";
import { formatForecastDays } from "./formatForecastDays";
import type { UnitSystem } from "./unitSystem";

type Props = { forecast: Forecast; unitSystem: UnitSystem };

export function ForecastDays({ forecast, unitSystem }: Props) {
  return (
    <ol aria-label="7-day forecast" className="forecast-days">
      {formatForecastDays(forecast, unitSystem).map((day, i) => (
        <li key={forecast.days[i].date} className="weather-panel forecast-day">
          <ConditionIcon condition={forecast.days[i].condition} />
          <span className="day-name">{day.day}</span>{" "}
          <span className="condition">{day.condition}</span>{" "}
          <span className="temperatures">
            {day.high} / {day.low}
          </span>{" "}
          <span>Precipitation: {day.precipitationChance}</span>{" "}
          <span>Wind: {day.maxWind}</span>
        </li>
      ))}
    </ol>
  );
}
