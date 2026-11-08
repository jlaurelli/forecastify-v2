import { z } from "zod";

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  /** State, province or other first-level region, when known. */
  region: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
});

export type Location = z.infer<typeof locationSchema>;
