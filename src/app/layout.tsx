import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "@/components/common/SoundProvider";
import { CustomCursor } from "@/components/common/CustomCursor";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  fallback: [
    "ui-monospace",
    "SF Mono",
    "Menlo",
    "Monaco",
    "Consolas",
    "monospace",
  ],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Fynux OS — Internal Business Operating System",
  description: "Pusat Kendali Operasional Fynux Digital Solutions",
  icons: {
    icon: "/fynux-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className={`${plusJakarta.className} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-950 font-sans`}>
        <SoundProvider>
          <CustomCursor />
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}


