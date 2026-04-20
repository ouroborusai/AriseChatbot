
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActiveCompanyProvider } from "@/contexts/ActiveCompanyContext";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arise Business OS",
  description: "Next-Generation AI Personal Agent for MTZ Consultores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Arise OS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
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
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#f7f9fb] antialiased`}>
        <ActiveCompanyProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ActiveCompanyProvider>
      </body>
    </html>
  );
}
