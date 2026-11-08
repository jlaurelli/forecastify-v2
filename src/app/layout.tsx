import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foreclaustify",
  description: "Find a place and see its upcoming weather.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
