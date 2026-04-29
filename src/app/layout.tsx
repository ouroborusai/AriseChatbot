import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arise Business OS",
  description: "Neural Operating System for Industrial Growth",
  manifest: "/manifest.json",
  icons: {
    icon: '/brand/official.png',
    apple: '/brand/official.png',
  },
  appleWebApp: {
    capable: true,
    title: "ARISE OS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ActiveCompanyProvider } from "@/contexts/ActiveCompanyContext";
import { MobileNavProvider } from "@/contexts/MobileNavContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased selection:bg-primary/30 selection:text-neural-dark">
        <ActiveCompanyProvider>
          <MobileNavProvider>
            {children}
          </MobileNavProvider>
        </ActiveCompanyProvider>
      </body>
    </html>
  );
}
