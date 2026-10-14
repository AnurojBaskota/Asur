import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Variable width axis gives us a heavy condensed display face.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASUR | Premium Gym Apparel",
  description:
    "Strength. Discipline. Identity. Premium fitness apparel rooted in Nepali heritage, built for modern athletes.",
  keywords: [
    "gym apparel",
    "fitness clothing",
    "premium sportswear",
    "ASUR",
    "Nepal",
    "athletic wear",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} ${plexMono.variable}`}>
      <body className="bg-asur-black text-asur-white antialiased">
        {children}
      </body>
    </html>
  );
}
