import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/app/globals.css";
import { Header } from "@/components/header";
import { CinematicBackground } from "@/components/cinematic-bg";
import { ClientProviders } from "@/components/client-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Timely AI | Wedding Timeline Orchestrator",
  description: "AI-powered wedding planning for modern couples.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-transparent font-sans antialiased overflow-x-hidden">
        <CinematicBackground />
        <ClientProviders>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
