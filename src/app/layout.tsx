import type { Metadata } from "next";
import { Bangers, Barlow_Condensed } from "next/font/google";
import { StoreHydrator } from "@/components/layout/StoreHydrator";
import "./globals.css";

const displayFont = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bangers",
  display: "swap",
});

const bodyFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Degen Tactics",
  description: "Every move counts. Protect the Vault in a deterministic tactical puzzle.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
