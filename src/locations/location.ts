export type Location = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  /** State, province or other first-level region, when known. */
  region?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};
