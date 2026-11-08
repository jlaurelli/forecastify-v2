import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Condition } from "./forecast";

const ICONS: Record<Condition, { icon: LucideIcon; color: string }> = {
  Clear: { icon: Sun, color: "#f0a202" },
  "Partly cloudy": { icon: CloudSun, color: "#d9921c" },
  Cloudy: { icon: Cloud, color: "#5f7f8d" },
  Fog: { icon: CloudFog, color: "#83a5b3" },
  Drizzle: { icon: CloudDrizzle, color: "#4a8fc0" },
  Rain: { icon: CloudRain, color: "#2f6fa3" },
  Snow: { icon: CloudSnow, color: "#6aa9d4" },
  Thunderstorm: { icon: CloudLightning, color: "#6b5b95" },
};

/** Decorative: the Condition is always shown as text beside it. */
export function ConditionIcon({ condition }: { condition: Condition }) {
  const { icon: Icon, color } = ICONS[condition];
  return <Icon className="condition-icon" color={color} strokeWidth={1.5} aria-hidden="true" />;
}
