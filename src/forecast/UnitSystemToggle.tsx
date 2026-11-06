import type { UnitSystem } from "./unitSystem";

type Props = {
  value: UnitSystem;
  onChange: (unitSystem: UnitSystem) => void;
};

const OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: "metric", label: "°C, km/h" },
  { value: "imperial", label: "°F, mph" },
];

export function UnitSystemToggle({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend>Units</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="unit-system"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
