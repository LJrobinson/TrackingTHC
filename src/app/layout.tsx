import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackingTHC",
  description: "Compliance-aware cannabis POS and inventory tracking prototype"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
