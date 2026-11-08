import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forecastify",
  description: "Find a place and see its upcoming weather.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions add attributes to <html> (e.g. data-google-analytics-opt-out)
    // before React hydrates. This silences mismatches in this element's own
    // attributes only; its children are still checked.
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
