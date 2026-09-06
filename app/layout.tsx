import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Black Hole Wallpaper",
  description: "Real-time GLSL black hole render with gravitational lensing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}