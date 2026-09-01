import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier — everything an artist needs",
  description:
    "Instrumentals, works, stages and people. The network where artists find what they need — and own what they buy.",
};

export const viewport: Viewport = {
  themeColor: "#100D1E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const PICK_MODE = `document.documentElement.className =
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "mode-flow" : "mode-game";`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="mode-flow">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: PICK_MODE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
