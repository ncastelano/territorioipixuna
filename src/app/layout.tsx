import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Território Ipixuna - Monitoramento Territorial",
  description: "Plataforma PWA de monitoramento ambiental e territorial do Amazonas, conectada a Supabase e Mapbox.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ipixuna PWA",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#080c14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterSW />
        <div className="app-container">
          <main className="main-content">
            {children}
          </main>
          <Navbar />
        </div>
      </body>
    </html>
  );
}
